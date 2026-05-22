import { sanitizePlan } from "./normalize";
import type { PlanDay } from "./types";
import { PlanResponseSchema } from "./validators";

export type PlanParseResult = {
  plan: PlanDay[];
  validationError?: string;
};

function validatePlanPayload(payload: unknown): PlanParseResult {
  const parsed = PlanResponseSchema.safeParse(payload);

  if (parsed.success) {
    return { plan: sanitizePlan(parsed.data) };
  }

  return {
    plan: [],
    validationError: parsed.error.issues
      .map((issue) => issue.path.join(".") || issue.message)
      .join(", "),
  };
}

function extractPlanPayload(payload: unknown): PlanParseResult {
  if (Array.isArray(payload)) return validatePlanPayload(payload);
  if (payload && typeof payload === "object" && "plan" in payload) {
    return validatePlanPayload((payload as { plan?: unknown }).plan);
  }
  return { plan: [] };
}

export function parsePlanFromTextResult(text: string): PlanParseResult {
  const t = String(text ?? "").trim();
  if (!t) return { plan: [] };

  // 1) まず JSON として素直にパース
  try {
    return extractPlanPayload(JSON.parse(t));
  } catch {}

  // 2) だめなら配列っぽい部分だけ拾って再パース（保険）
  const start = t.indexOf("[");
  const end = t.lastIndexOf("]");
  if (start >= 0 && end > start) {
    try {
      return extractPlanPayload(JSON.parse(t.slice(start, end + 1)));
    } catch {}
  }

  return { plan: [] };
}

export function parsePlanFromText(text: string): PlanDay[] {
  return parsePlanFromTextResult(text).plan;
}
