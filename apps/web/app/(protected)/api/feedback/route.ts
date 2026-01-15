import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import crypto from "crypto";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/src/lib/dynamodb";
import { requireAuth } from "@/src/lib/authServer";
import { getClientIp, rateLimit } from "@/src/lib/rateLimit";
import { hash8, log } from "@/src/lib/logger";
import { ensureServerEnv } from "@/src/lib/envServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GOALS_TABLE = process.env.DDB_GOALS_TABLE || "StudyGoals";
const MODEL = "gpt-4.1-mini";
const MAX_CONTENT_LENGTH = 4000;

function safeNumber(v: any): number | null {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
}

function getOpenAiApiKey(): string | null {
  if (typeof process === "undefined" || !process.env) return null;
  return (
    process.env.AMPLIFY_OPENAI_API_KEY ??
    process.env.AWS_AMPLIFY_OPENAI_API_KEY ??
    process.env.OPENAI_API_KEY ??
    null
  );
}

type PlanDay = { date: string; theme?: string; tasks?: string[] };

async function getPlanDay(userId: string, date: string, requestId: string): Promise<PlanDay | null> {
  const res = await ddb.send(new GetCommand({ TableName: GOALS_TABLE, Key: { userId } }));
  if (!res.Item) return null;

  const plan = (res.Item as any).plan;
  if (!Array.isArray(plan)) return null;

  const day = plan.find((p: any) => p?.date === date);
  if (!day) return null;

  const rawTasks = Array.isArray(day.tasks) ? day.tasks : Array.isArray(day.topics) ? day.topics : [];
  const tasks = rawTasks.filter((t: any) => typeof t === "string");
  const theme = typeof day.theme === "string" ? day.theme : undefined;

  log("info", "plan found", { requestId, userIdHash: hash8(userId), date, plannedTasks: tasks.length, hasTheme: Boolean(theme) });
  return { date, theme, tasks };
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const start = Date.now();

  try {
    const auth = await requireAuth(req);
    if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const ip = getClientIp(req.headers);
    const limiter = rateLimit(`feedback:${auth.userId}:${ip}`, { limit: 10, windowMs: 60_000 });
    if (!limiter.ok) {
      const retryAfter = Math.max(1, Math.ceil((limiter.resetAt - Date.now()) / 1000));
      log("warn", "feedback rate limit", {
        requestId,
        userIdHash: hash8(auth.userId),
        ip,
        retryAfter,
      });
      return NextResponse.json(
        { error: "rate limit exceeded" },
        { status: 429, headers: { "Retry-After": retryAfter.toString() } },
      );
    }

    ensureServerEnv();
    const openAiApiKey = process.env.OPENAI_API_KEY;
    if (!openAiApiKey) {
      log("error", "OPENAI_API_KEY missing", {
        requestId,
        userIdHash: hash8(auth.userId),
        hasAmplifyOpenAiKey: Boolean(process.env.AMPLIFY_OPENAI_API_KEY),
        hasAwsAmplifyOpenAiKey: Boolean(process.env.AWS_AMPLIFY_OPENAI_API_KEY),
        hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
      });
      return NextResponse.json({ error: "Server misconfigured", requestId }, { status: 500 });
    }

    const client = new OpenAI({ apiKey: openAiApiKey });

    const body = await req.json();
    const content = String(body.content ?? "").trim();
    const date = String(body.date ?? "").trim();
    const studyTime = safeNumber(body.studyTime);
    const tasksCompleted = safeNumber(body.tasksCompleted);

    if (!content || !date) return NextResponse.json({ error: "content and date are required" }, { status: 400 });
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json({ error: "content is too long" }, { status: 400 });
    }

    log("info", "feedback input", {
      requestId,
      userIdHash: hash8(auth.userId),
      date,
      studyTime,
      tasksCompleted,
      contentLen: content.length,
    });

    const planDay = await getPlanDay(auth.userId, date, requestId);
    const plannedTasks = planDay?.tasks?.length ?? null;

    const completionRate =
      plannedTasks && tasksCompleted != null ? Math.min(1, Math.max(0, tasksCompleted / plannedTasks)) : null;

    const system = [
      "あなたは資格学習を応援する優しいコーチです。",
      "日報（実績）と当日の計画（予定）を比較し、進捗・ズレを具体的にコメントしてください。",
      "出力は必ず日本語。空文字は禁止。",
      "構成：①ねぎらい ②進捗評価（計画比）③次の一手 1〜2個（具体的）",
      "断定しすぎない。情報が無い部分は推測しない。",
    ].join("\n");

    const user = [
      `【日付】${date}`,
      `【日報】${content}`,
      `【学習時間(時間)】${studyTime ?? "不明"}`,
      `【完了タスク数】${tasksCompleted ?? "不明"}`,
      planDay
        ? `【当日の計画】テーマ: ${planDay.theme ?? "不明"} / 予定タスク: ${JSON.stringify(planDay.tasks ?? [])}`
        : "【当日の計画】未登録または取得できませんでした",
      completionRate != null ? `【計画タスク達成率】${Math.round(completionRate * 100)}%` : "",
    ].filter(Boolean).join("\n");

    // ---- timeout guard
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 8000);

    let completion;
    try {
      completion = await client.chat.completions.create(
        {
          model: MODEL,
          max_completion_tokens: 240,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        },
        { signal: ac.signal }
      );
    } finally {
      clearTimeout(timer);
    }

    const commentText = completion.choices?.[0]?.message?.content?.trim() ?? "";

    if (!commentText) {
      log("warn", "empty completion", {
        requestId,
        userIdHash: hash8(auth.userId),
        date,
        finishReason: completion.choices?.[0]?.finish_reason,
        model: completion.model,
        ms: Date.now() - start,
      });
      return NextResponse.json({ comment: "コメントを取得できませんでした（AI応答が空でした）。", requestId });
    }

    log("info", "feedback success", {
      requestId,
      userIdHash: hash8(auth.userId),
      date,
      ms: Date.now() - start,
      chars: commentText.length,
      hasPlan: Boolean(planDay),
    });

    return NextResponse.json({ comment: commentText, requestId });
  } catch (e: any) {
    const message = e?.message ?? String(e);

    log("error", "feedback error", { requestId, message, ms: Date.now() - start });

    // タイムアウト/abort の場合は 500 じゃなく 200 で固定文返すのもアリ（UX優先）
    if (String(message).toLowerCase().includes("aborted")) {
      return NextResponse.json({ comment: "今日はここまででも十分！次は計画と照らして1点だけ復習しよう。", requestId });
    }

    return NextResponse.json({ error: "AIコメント生成に失敗しました", requestId }, { status: 500 });
  }
}
