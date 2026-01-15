import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/src/lib/dynamodb";
import { requireAuth } from "@/src/lib/authServer";
import { getClientIp, rateLimit } from "@/src/lib/rateLimit";
import { hash8, log } from "@/src/lib/logger";
import { ensureServerEnv } from "@/src/lib/envServer";

const CERTIFICATIONS_TABLE =
  process.env.DDB_CERTIFICATIONS_TABLE || "Certifications";
const MAX_CERT_NAME_LENGTH = 200;
const MAX_EXAM_DATE_LENGTH = 20;
const MAX_PLAN_DAYS = 366;
const MAX_TASKS_PER_DAY = 20;
const MAX_TASK_LENGTH = 200;
const MAX_THEME_LENGTH = 200;
const MAX_EXAM_GUIDE_CHARS = 1500;
const OPENAI_MAX_TOKENS = 1200;
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

type GeneratePlanRequest = {
  goal: {
    certCode?: string;
    certName: string;
    examDate: string; // YYYY-MM-DD
    weeklyHours: number | null; // 目標学習時間（時間）
  };
};

type ExamGuide =
  | string
  | {
      summary?: string;
      topics?: string[];
      sourceUrl?: string;
      notes?: string;
    };

type PlanDay = {
  date: string;
  theme?: string;
  tasks?: string[];
};

function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: string }).name === "AbortError"
  );
}

function formatExamGuide(guide: ExamGuide | undefined): string | null {
  if (!guide) return null;
  if (typeof guide === "string") {
    const trimmed = guide.trim();
    if (!trimmed) return null;
    return trimmed.slice(0, MAX_EXAM_GUIDE_CHARS);
  }
  const lines: string[] = [];
  if (guide.summary) lines.push(`概要: ${guide.summary}`);
  if (Array.isArray(guide.topics) && guide.topics.length > 0) {
    lines.push(`主要トピック:\n- ${guide.topics.join("\n- ")}`);
  }
  if (guide.notes) lines.push(`備考: ${guide.notes}`);
  if (guide.sourceUrl) lines.push(`参照URL: ${guide.sourceUrl}`);
  const formatted = lines.join("\n").trim();
  if (!formatted) return null;
  return formatted.slice(0, MAX_EXAM_GUIDE_CHARS);
}

function normalizeDateString(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (DATE_ONLY_REGEX.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return trimmed.slice(0, MAX_EXAM_DATE_LENGTH);
  }
  parsed.setHours(0, 0, 0, 0);
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

function sanitizePlan(input: unknown): PlanDay[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, MAX_PLAN_DAYS).map((day) => {
    const date =
      typeof day?.date === "string" ? normalizeDateString(day.date) : "";
    const theme = typeof day?.theme === "string" ? day.theme.trim().slice(0, MAX_THEME_LENGTH) : undefined;
    const rawTasks = Array.isArray(day?.tasks) ? day.tasks : [];
    const tasks = rawTasks
      .filter((task: unknown) => typeof task === "string")
      .slice(0, MAX_TASKS_PER_DAY)
      .map((task: string) => task.trim().slice(0, MAX_TASK_LENGTH))
      .filter((task: string) => task.length > 0);
    return { date, theme, tasks };
  });
}

function extractPlanPayload(payload: unknown): PlanDay[] {
  if (Array.isArray(payload)) return sanitizePlan(payload);
  if (payload && typeof payload === "object" && "plan" in payload) {
    return sanitizePlan((payload as { plan?: unknown }).plan);
  }
  return [];
}

function parsePlanFromText(text: string, requestId: string): PlanDay[] {
  if (!text) return [];
  try {
    return extractPlanPayload(JSON.parse(text));
  } catch (error) {
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start >= 0 && end > start) {
      const slice = text.slice(start, end + 1);
      try {
        log("warn", "plan api json fallback parse", { requestId });
        return extractPlanPayload(JSON.parse(slice));
      } catch (innerError) {
        log("error", "plan api json fallback failed", { requestId, error: String(innerError) });
      }
    }
    log("error", "failed to parse plan JSON", { requestId, error: String(error) });
    return [];
  }
}

async function fetchExamGuide(certCode?: string): Promise<string | null> {
  if (!certCode) return null;
  try {
    const res = await ddb.send(
      new GetCommand({
        TableName: CERTIFICATIONS_TABLE,
        Key: { code: certCode },
      }),
    );
    const item = res.Item as { examGuide?: ExamGuide; examGuideText?: string } | undefined;
    return formatExamGuide(item?.examGuide ?? item?.examGuideText);
  } catch (error) {
    log("error", "failed to load exam guide", { error: String(error), certCode });
    return null;
  }
}

export async function POST(req: NextRequest) {
  const requestId =
    req.headers.get("x-request-id") ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const requestStartedAt = Date.now();
  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 },
      );
    }
    const client = new OpenAI({
      apiKey: openAiApiKey,
    });

    const ip = getClientIp(req.headers);
    const limiter = rateLimit(`plan:${auth.userId}:${ip}`, { limit: 5, windowMs: 60_000 });
    if (!limiter.ok) {
      const retryAfter = Math.max(1, Math.ceil((limiter.resetAt - Date.now()) / 1000));
      log("warn", "plan rate limit", {
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

    const body = (await req.json()) as GeneratePlanRequest;
    const { goal } = body;

    const certName = String(goal?.certName ?? "").trim().slice(0, MAX_CERT_NAME_LENGTH);
    const examDate = String(goal?.examDate ?? "").trim().slice(0, MAX_EXAM_DATE_LENGTH);

    if (!certName || !examDate) {
      return NextResponse.json(
        { error: "goal.certName と goal.examDate は必須です" },
        { status: 400 },
      );
    }

    const examGuideStartedAt = Date.now();
    const examGuide = await fetchExamGuide(goal.certCode);
    const examGuideElapsedMs = Date.now() - examGuideStartedAt;
    const examGuideSection = examGuide
      ? `\n試験ガイド情報:\n${examGuide}\n`
      : "\n試験ガイド情報: 未登録\n";

    const prompt = `
資格名: ${certName}
試験日: ${examDate}
目標の学習時間: ${goal.weeklyHours ?? "未設定"} 時間
${examGuideSection}

上記をもとに、試験日までの学習計画を立ててください。
レスポンスは必ず JSON オブジェクトで返してください。
フォーマットは { "plan": [ ... ] } のみです。
各要素は以下の形式で、タスクは最大3件までにしてください：
{
  "date": "YYYY-MM-DD",
  "theme": "その日の学習テーマ",
  "tasks": ["具体的なタスク1", "具体的なタスク2"]
}
テーマ・タスクは必ず日本語で記述してください。
`;

    const rawTimeoutMs = Number(process.env.PLAN_API_TIMEOUT_MS ?? "20000");
    const timeoutMs = Number.isFinite(rawTimeoutMs)
      ? Math.min(Math.max(rawTimeoutMs, 1000), 60000)
      : 8000;
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);

    let completion;
    try {
      const openAiStartedAt = Date.now();
      completion = await client.chat.completions.create(
        {
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content:
                "あなたは資格学習のコーチです。ユーザーの試験日から逆算して、現実的な日次学習計画を日本語の JSON で返してください。",
            },
            { role: "user", content: prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "study_plan",
              schema: {
                type: "object",
                additionalProperties: false,
                required: ["plan"],
                properties: {
                  plan: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["date", "theme", "tasks"],
                      properties: {
                        date: { type: "string" },
                        theme: { type: "string" },
                        tasks: {
                          type: "array",
                          items: { type: "string" },
                          maxItems: 3,
                        },
                      },
                    },
                  },
                },
              },
              strict: true,
            },
          },
          max_tokens: OPENAI_MAX_TOKENS,
        },
        { signal: ac.signal },
      );
      log("info", "plan api openai completed", {
        requestId,
        elapsedMs: Date.now() - openAiStartedAt,
        model: completion.model,
        finishReason: completion.choices?.[0]?.finish_reason,
      });
    } catch (error) {
      if (ac.signal.aborted || isAbortError(error)) {
        log("warn", "plan api openai timeout", {
          requestId,
          elapsedMs: Date.now() - requestStartedAt,
          timeoutMs,
        });
        return NextResponse.json({
          plan: [],
          warning: "計画の生成がタイムアウトしました。しばらくしてから再試行してください。",
        });
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }

    const msg = completion.choices[0]?.message;
    const text = (msg?.content ?? "").toString().trim();

    const plan = parsePlanFromText(text, requestId);

    log("info", "plan api success", {
      requestId,
      userIdHash: hash8(auth.userId),
      elapsedMs: Date.now() - requestStartedAt,
      planDays: plan.length,
      hasExamGuide: Boolean(examGuide),
      examGuideElapsedMs,
    });
    return NextResponse.json({ plan });
  } catch (e: unknown) {
    if (isAbortError(e)) {
      log("warn", "plan api aborted", {
        requestId,
        elapsedMs: Date.now() - requestStartedAt,
      });
      return NextResponse.json({
        plan: [],
        warning: "計画の生成がタイムアウトしました。しばらくしてから再試行してください。",
      });
    }
    log("error", "plan api error", { requestId, error: String(e) });
    return NextResponse.json(
      {
        error: "学習計画の生成に失敗しました",
      },
      { status: 500 },
    );
  }
}
