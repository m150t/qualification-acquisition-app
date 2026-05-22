import { sanitizePlan } from "./normalize";
import type { PlanDay } from "./types";

function extractPlanPayload(payload: unknown): PlanDay[] {
  if (Array.isArray(payload)) return sanitizePlan(payload);
  if (payload && typeof payload === "object" && "plan" in payload) {
    return sanitizePlan((payload as { plan?: unknown }).plan);
  }
  return [];
}

export function parsePlanFromText(text: string): PlanDay[] {
  const t = String(text ?? "").trim();
  if (!t) return [];

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

  return [];
}
