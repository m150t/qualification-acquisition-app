import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import crypto from "crypto";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/src/lib/dynamodb";

const GOALS_TABLE = process.env.DDB_GOALS_TABLE || "StudyGoals";
const MODEL = "gpt-5-nano";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

function getUserId(req: NextRequest) {
  return req.headers.get("x-user-id");
}

function hash8(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex").slice(0, 8);
}

function log(level: "info" | "warn" | "error", msg: string, meta: Record<string, any>) {
  console[level](JSON.stringify({ level, msg, time: new Date().toISOString(), ...meta }));
}

function safeNumber(v: any): number | null {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
}

type PlanDay = {
  date: string;      // 'YYYY-MM-DD'
  theme?: string;
  tasks?: string[];
};

async function getPlanDay(userId: string, date: string, requestId: string): Promise<PlanDay | null> {
  const res = await ddb.send(
    new GetCommand({
      TableName: GOALS_TABLE,
      Key: { userId },
    })
  );

  if (!res.Item) return null;

  const plan = (res.Item as any).plan;
  if (!Array.isArray(plan)) return null;

  const day = plan.find((p: any) => p?.date === date);
  if (!day) return null;

  const tasks = Array.isArray(day.tasks) ? day.tasks.filter((t: any) => typeof t === "string") : [];
  const theme = typeof day.theme === "string" ? day.theme : undefined;

  log("info", "plan found", {
    requestId,
    userIdHash: hash8(userId),
    date,
    plannedTasks: tasks.length,
    hasTheme: Boolean(theme),
  });

  return { date, theme, tasks };
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const start = Date.now();

  try {
    const userId = getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "userId header is required" }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      log("error", "OPENAI_API_KEY missing", { requestId, userIdHash: hash8(userId) });
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const body = await req.json();
    const content = String(body.content ?? "");
    const date = String(body.date ?? ""); 
    const studyTime = safeNumber(body.studyTime);
    const tasksCompleted = safeNumber(body.tasksCompleted);

    if (!content || !date) {
      return NextResponse.json({ error: "content and date are required" }, { status: 400 });
    }

    log("info", "feedback input", {
      requestId,
      userIdHash: hash8(userId),
      date,
      studyTime,
      tasksCompleted,
      contentLen: content.length,
    });

    // 1) 計画を取得（同じ StudyGoals テーブルの plan 配列から当日分）
    const planDay = await getPlanDay(userId, date, requestId);
    const plannedTasks = planDay?.tasks?.length ?? null;

    // 2) 達成率（取れる時だけ）
    const completionRate =
      plannedTasks && tasksCompleted != null ? Math.min(1, Math.max(0, tasksCompleted / plannedTasks)) : null;

    // 3) プロンプト
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
    ]
      .filter(Boolean)
      .join("\n");

    // 4) OpenAI
    const completion = await client.chat.completions.create({
      model: MODEL,
      max_completion_tokens: 240,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const commentText = completion.choices?.[0]?.message?.content?.trim() ?? "";

    if (!commentText) {
      log("warn", "empty completion", {
        requestId,
        userIdHash: hash8(userId),
        date,
        finishReason: completion.choices?.[0]?.finish_reason,
        model: completion.model,
        ms: Date.now() - start,
      });
      
      return NextResponse.json({
        comment: "コメントを取得できませんでした（AI応答が空でした）。",
      });
    }

    log("info", "feedback success", {
      requestId,
      userIdHash: hash8(userId),
      date,
      ms: Date.now() - start,
      chars: commentText.length,
      hasPlan: Boolean(planDay),
    });

    return NextResponse.json({ comment: commentText });
  } catch (e: any) {
    const status = e?.status ?? e?.response?.status;
    const message = e?.message ?? String(e);

    log("error", "feedback error", {
      requestId,
      status,
      message,
      ms: Date.now() - start,
    });

    return NextResponse.json(
      { error: "AIコメント生成に失敗しました", detail: message, requestId },
      { status: 500 }
    );
  }
}
