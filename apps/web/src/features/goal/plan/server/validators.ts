// ==================================================
// 入力検証だけ
// ==================================================
import { z } from "zod";
import type { GeneratePlanRequest } from "./types";

const MAX_CERT_NAME_LENGTH = 200;
const MAX_EXAM_DATE_LENGTH = 20;

type GeneratePlanRequestBody = {
  goal?: {
    certCode?: unknown;
    certName?: unknown;
    examDate?: unknown;
    weeklyHours?: unknown;
  };
};

export const GeneratePlanRequestSchema = z
  .object({
    goal: z
      .object({
        certCode: z.unknown().optional(),
        certName: z.unknown().optional(),
        examDate: z.unknown().optional(),
        weeklyHours: z.unknown().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const PlanDaySchema = z
  .object({
    date: z.string(),
    theme: z.string().optional(),
    tasks: z.array(z.string()).optional(),
  })
  .passthrough();

export const PlanResponseSchema = z.array(PlanDaySchema);

export function validateGeneratePlanRequest(body: unknown): { ok: true; value: GeneratePlanRequest } | { ok: false; error: string } {
  const parsed = GeneratePlanRequestSchema.safeParse(
    body && typeof body === "object" ? body : {},
  );
  if (!parsed.success) return { ok: false, error: "goal is required" };

  const input = parsed.data as GeneratePlanRequestBody;
  const goal = input.goal;
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
        certCode: typeof goal.certCode === "string" ? goal.certCode : undefined,
        certName,
        examDate,
        weeklyHours: safeWeeklyHours,
      },
    },
  };
}
