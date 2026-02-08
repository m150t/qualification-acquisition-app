// ==================================================
// 入力検証だけ
// ==================================================
import { GeneratePlanRequest } from "./types";

const MAX_CERT_NAME_LENGTH = 200;
const MAX_EXAM_DATE_LENGTH = 20;

export function validateGeneratePlanRequest(body: any): { ok: true; value: GeneratePlanRequest } | { ok: false; error: string } {
  const goal = body?.goal;
  if (!goal) return { ok: false, error: "goal is required" };

  const certName = String(goal.certName ?? "").trim().slice(0, MAX_CERT_NAME_LENGTH);
  const examDate = String(goal.examDate ?? "").trim().slice(0, MAX_EXAM_DATE_LENGTH);

  if (!certName) return { ok: false, error: "goal.certName is required" };
  if (!examDate) return { ok: false, error: "goal.examDate is required" };

  const weeklyHours = goal.weeklyHours == null ? null : Number(goal.weeklyHours);
  const safeWeeklyHours = Number.isFinite(weeklyHours) ? weeklyHours : null;

  return {
    ok: true,
    value: {
      goal: {
        certCode: goal.certCode,
        certName,
        examDate,
        weeklyHours: safeWeeklyHours,
      },
    },
  };
}
