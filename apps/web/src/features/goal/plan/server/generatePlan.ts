// ==================================================
// 生成AIで学習計画を作る（plan APIのコア / usecase）
// ==================================================

import { hash8, log } from "@/lib/logger";
import type { PlanDay } from "./types";
import { getExamGuideByCode } from "./examGuideRepo";
import { buildPlanPrompt } from "./prompt";
import { parsePlanFromText } from "./parser";
import { validateGeneratePlanRequest } from "./validators";
import { createOpenAiClient } from "@/lib/ai/client";
import { withTimeout } from "@/lib/ai/timeout";

const OPENAI_MODEL = "gpt-4.1-mini";
const OPENAI_MAX_TOKENS = 1200;

export type ServiceError = { status: number; error: string };
type Ok = { plan: PlanDay[]; warning?: string };

function resolveTimeoutMs(): number {
  const raw = Number(process.env.PLAN_API_TIMEOUT_MS ?? "30000");
  if (!Number.isFinite(raw)) return 30000;
  return Math.min(Math.max(raw, 1000), 60000);
}

export async function generatePlan(params: {
  requestId: string;
  userId: string;
  body: unknown;
}): Promise<Ok | ServiceError> {
  const startedAt = Date.now();
  const { requestId, userId, body } = params;

  // 0) 入力検証（ここで型を確定）
  const validated = validateGeneratePlanRequest(body);
  if (!validated.ok) return { status: 400, error: validated.error };

  const input = validated.value;
  const certCode = input.goal.certCode;

  // 1) 試験ガイド（失敗してもnullで続行）
  const examGuide = await getExamGuideByCode(certCode).catch((e) => {
    log("error", "plan examGuide load failed", {
      requestId,
      userIdHash: hash8(userId),
      certCode,
      error: String(e),
    });
    return null;
  });

  // 2) prompt生成（examDate不正などはここで落とす）
  const built = buildPlanPrompt(input, examGuide);
  if (!built) return { status: 400, error: "goal.examDate の形式が不正です" };

  // 3) OpenAI client（Secrets必須。env直参照禁止）
  const client = await createOpenAiClient().catch((e) => {
    log("error", "plan openai client init failed", {
      requestId,
      userIdHash: hash8(userId),
      error: String(e),
    });
    return null;
  });
  if (!client) return { status: 500, error: "Server misconfigured" };

  // 4) OpenAI call（timeout）
  const timeoutMs = resolveTimeoutMs();

  try {
    const completion = await withTimeout(
      (signal) =>
        client.chat.completions.create({
          model: OPENAI_MODEL,
          messages: [
            { role: "system", content: built.messages.system },
            { role: "user", content: built.messages.user },
          ],
          response_format: built.responseFormat,
          max_tokens: OPENAI_MAX_TOKENS,
        }, { signal }),
      timeoutMs,
    );

    const text = String(completion.choices?.[0]?.message?.content ?? "").trim();
    const plan = parsePlanFromText(text);

    log("info", "plan generate success", {
      requestId,
      userIdHash: hash8(userId),
      elapsedMs: Date.now() - startedAt,
      planDays: plan.length,
      hasExamGuide: Boolean(examGuide),
      model: completion.model,
      finishReason: completion.choices?.[0]?.finish_reason,
    });

    return { plan };
  } catch (e: unknown) {
    // timeout（Abort）は warning で返す：UX優先
    const errorLike = e as { name?: unknown; message?: unknown };
    if (String(errorLike.name ?? "").includes("Abort") || String(errorLike.message ?? "").toLowerCase().includes("aborted")) {
      log("warn", "plan generate timeout", {
        requestId,
        userIdHash: hash8(userId),
        timeoutMs,
        elapsedMs: Date.now() - startedAt,
      });
      return { plan: [], warning: "計画の生成がタイムアウトしました。しばらくしてから再試行してください。" };
    }

    log("error", "plan generate failed", {
      requestId,
      userIdHash: hash8(userId),
      elapsedMs: Date.now() - startedAt,
      error: String(e),
    });
    return { status: 500, error: "学習計画の生成に失敗しました" };
  }
}
