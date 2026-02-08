// ==================================================
// Feedback 用プロンプト生成
// ==================================================
import { PlanDay } from "./types";

export function buildFeedbackSystemPrompt() {
  return [
    "あなたは資格学習を応援するコーチです。",
    "日報（実績）と当日の計画（予定）を比較し、進捗・ズレを具体的にコメントしてください。",
    "出力は必ず日本語。空文字は禁止。",
    "構成：①ねぎらい ②進捗評価（計画比）③次の一手 1〜2個（具体的）",
    "断定しすぎない。情報が無い部分は推測しない。",
  ].join("\n");
}

export function buildFeedbackUserPrompt(params: {
  date: string;
  content: string;
  studyTime: number | null;
  tasksCompleted: number | null;
  planDay: PlanDay | null;
  completionRate: number | null; // 0除算は service 側で null にしてOK
}) {
  const { date, content, studyTime, tasksCompleted, planDay, completionRate } = params;

  return [
    `【日付】${date}`,
    `【日報】${content}`,
    `【学習時間(時間)】${studyTime ?? "不明"}`,
    `【完了タスク数】${tasksCompleted ?? "不明"}`,
    planDay
      ? `【当日の計画】テーマ: ${planDay.theme ?? "不明"} / 予定タスク: ${JSON.stringify(planDay.tasks ?? [])}`
      : "【当日の計画】未登録または取得できませんでした",
    // UIには出さない方針でも、AIが “計画比” を判断する助けとして渡すのは有効
    completionRate != null ? `【計画タスク達成率】${Math.round(completionRate * 100)}%` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
