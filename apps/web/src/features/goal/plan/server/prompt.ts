// ==================================================
// OpenAIへ渡す「prompt部品」を生成する
// ==================================================

import type { ExamGuide, GeneratePlanRequest } from "./types";

const MAX_EXAM_GUIDE_CHARS = 1500;
const MAX_PLAN_DAYS = 366;
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function normalizeDateString(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (DATE_ONLY_REGEX.test(trimmed)) return trimmed;

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return trimmed.slice(0, 20);

  parsed.setHours(0, 0, 0, 0);
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateOnly(value: Date): string {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * 試験日から「今日〜試験前日」までの window を決める
 */
export function getPlanWindow(examDateInput: string, today = new Date()) {
  const normalized = normalizeDateString(examDateInput);
  const examDate = new Date(normalized);
  if (Number.isNaN(examDate.getTime())) return null;

  const start = new Date(today);
  start.setHours(0, 0, 0, 0);

  const diffMs = examDate.getTime() - start.getTime();
  const daysUntilExam = Math.max(1, Math.ceil(diffMs / MS_PER_DAY));
  const end = new Date(start.getTime() + (daysUntilExam - 1) * MS_PER_DAY);

  return {
    startDate: formatDateOnly(start),
    endDate: formatDateOnly(end),
    totalDays: Math.min(daysUntilExam, MAX_PLAN_DAYS),
  };
}

function formatExamGuide(guide: ExamGuide | null): string {
  if (!guide) return "試験ガイド情報: 未登録";

  if (typeof guide === "string") {
    const t = guide.trim().slice(0, MAX_EXAM_GUIDE_CHARS);
    return t ? `試験ガイド情報:\n${t}` : "試験ガイド情報: 未登録";
  }

  const lines: string[] = [];
  if (guide.summary) lines.push(`概要: ${guide.summary}`);
  if (Array.isArray(guide.topics) && guide.topics.length) {
    lines.push(`主要トピック:\n- ${guide.topics.join("\n- ")}`);
  }
  if (guide.notes) lines.push(`備考: ${guide.notes}`);
  if (guide.sourceUrl) lines.push(`参照URL: ${guide.sourceUrl}`);

  const formatted = lines.join("\n").trim().slice(0, MAX_EXAM_GUIDE_CHARS);
  return formatted ? `試験ガイド情報:\n${formatted}` : "試験ガイド情報: 未登録";
}

/**
 * plan生成用の「OpenAIへ渡す部品セット」を作る
 * - generatePlan.ts はここから受け取ったものをそのまま投げるだけ
 */
export function buildPlanPrompt(req: GeneratePlanRequest, examGuide: ExamGuide | null) {
  const w = getPlanWindow(req.goal.examDate);
  if (!w) return null;

  const guideSection = formatExamGuide(examGuide);

  // system: キャラ/制約（固定）
  const system = [
    "あなたは資格学習のコーチです。",
    "ユーザーの試験日から逆算して、現実的な日次学習計画を作成してください。",
    "出力は必ず日本語。",
    "出力は必ず JSON のみ（余計な文章は禁止）。",
  ].join("\n");

  // user: 入力データ（変動）
  const user = `
資格名: ${req.goal.certName ?? "未設定"}
試験日: ${req.goal.examDate}
学習期間: ${w.startDate} から ${w.endDate} までの合計 ${w.totalDays} 日（試験日は含めない）
目標の学習時間: ${req.goal.weeklyHours ?? "未設定"} 時間/週

${guideSection}

上記をもとに、試験日までの学習計画を立ててください。
必ず ${w.startDate} から ${w.endDate} までの連続した日付を ${w.totalDays} 日分すべて含めてください。
`.trim();

  // schema: response_format をここに閉じ込める（generatePlan側に散らさない）
  const responseFormat = {
    type: "json_schema" as const,
    json_schema: {
      name: "study_plan",
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["plan"],
        properties: {
          plan: {
            type: "array",
            minItems: w.totalDays,
            maxItems: w.totalDays,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["date", "theme", "tasks"],
              properties: {
                date: { type: "string" },
                theme: { type: "string" },
                tasks: { type: "array", items: { type: "string" }, maxItems: 3 },
              },
            },
          },
        },
      },
      strict: true,
    },
  };

  return {
    window: w,
    messages: { system, user },
    responseFormat,
  };
}
