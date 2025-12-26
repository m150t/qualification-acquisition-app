import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/src/lib/dynamodb";
import { requireAuth } from "@/src/lib/authServer";
import { getClientIp, rateLimit } from "@/src/lib/rateLimit";

const CERTIFICATIONS_TABLE =
  process.env.DDB_CERTIFICATIONS_TABLE || "Certifications";
const MAX_CERT_NAME_LENGTH = 200;
const MAX_EXAM_DATE_LENGTH = 20;
const MAX_PLAN_DAYS = 366;
const MAX_TASKS_PER_DAY = 20;
const MAX_TASK_LENGTH = 200;
const MAX_THEME_LENGTH = 200;

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

function formatExamGuide(guide: ExamGuide | undefined): string | null {
  if (!guide) return null;
  if (typeof guide === "string") {
    return guide.trim() || null;
  }
  const lines: string[] = [];
  if (guide.summary) lines.push(`概要: ${guide.summary}`);
  if (Array.isArray(guide.topics) && guide.topics.length > 0) {
    lines.push(`主要トピック:\n- ${guide.topics.join("\n- ")}`);
  }
  if (guide.notes) lines.push(`備考: ${guide.notes}`);
  if (guide.sourceUrl) lines.push(`参照URL: ${guide.sourceUrl}`);
  const formatted = lines.join("\n");
  return formatted.trim() || null;
}

function sanitizePlan(input: unknown): PlanDay[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, MAX_PLAN_DAYS).map((day) => {
    const date = typeof day?.date === "string" ? day.date.trim().slice(0, MAX_EXAM_DATE_LENGTH) : "";
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
    console.error("failed to load exam guide", error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 },
      );
    }
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const ip = getClientIp(req.headers);
    const limiter = rateLimit(`plan:${auth.userId}:${ip}`, { limit: 5, windowMs: 60_000 });
    if (!limiter.ok) {
      const retryAfter = Math.max(1, Math.ceil((limiter.resetAt - Date.now()) / 1000));
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

    const examGuide = await fetchExamGuide(goal.certCode);
    const examGuideSection = examGuide
      ? `\n試験ガイド情報:\n${examGuide}\n`
      : "\n試験ガイド情報: 未登録\n";

    const prompt = `
資格名: ${certName}
試験日: ${examDate}
目標の学習時間: ${goal.weeklyHours ?? "未設定"} 時間
${examGuideSection}

上記をもとに、試験日までの学習計画を立ててください。
レスポンスは必ず JSON 配列のみで返してください。各要素は以下の形式：
{
  "date": "YYYY-MM-DD",
  "theme": "その日の学習テーマ",
  "tasks": ["具体的なタスク1", "具体的なタスク2"]
}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "あなたは資格学習のコーチです。ユーザーの試験日から逆算して、現実的な日次学習計画を JSON で返してください。",
        },
        { role: "user", content: prompt },
      ],
    });

    const msg = completion.choices[0]?.message;
    const text = (msg?.content ?? "").toString().trim();

    let plan: PlanDay[] = [];

    try {
      if (text) {
        const parsed = JSON.parse(text);
        plan = sanitizePlan(parsed);
      }
    } catch (e) {
      console.error("failed to parse plan JSON", e);
      // パース失敗時は空配列で返す
      plan = [];
    }

    return NextResponse.json({ plan });
  } catch (e: unknown) {
    console.error("plan api error", e);
    return NextResponse.json(
      {
        error: "学習計画の生成に失敗しました",
      },
      { status: 500 },
    );
  }
}
