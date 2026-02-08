// ==================================================
// Reports/Feedback のユースケース層（service）
// ==================================================
import { hash8, log } from "@/lib/logger";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { createOpenAiClient } from "@/lib/ai/client";
import { withTimeout, isAbortError } from "@/lib/ai/timeout";
import { ServiceError } from "@/lib/apiRouteHelpers";
import { findPlanDay } from "./goalPlanRepo";
import { buildFeedbackSystemPrompt, buildFeedbackUserPrompt } from "./prompt";
import { FeedbackRequest } from "./types";

const MODEL = "gpt-4.1-mini";
const MAX_CONTENT_LENGTH = 4000;

function safeNumber(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

function badRequest(msg: string): ServiceError {
  return { status: 400, error: msg };
}

export async function generateFeedback(params: {
  requestId: string;
  userId: string;
  input: FeedbackRequest;
  headers: Headers; // rateLimit用
}) {
  const { requestId, userId, input, headers } = params;

  const date = String(input?.date ?? "").trim();
  const content = String(input?.content ?? "").trim();
  const studyTime = safeNumber(input?.studyTime);
  const tasksCompleted = safeNumber(input?.tasksCompleted);

  if (!date) return badRequest("date is required");
  if (!content) return badRequest("content is required");
  if (content.length > MAX_CONTENT_LENGTH) return badRequest("content is too long");

  // --- rate limit（reports/feedback 用）
  const ip = getClientIp(headers);
  const limiter = rateLimit(`feedback:${userId}:${ip}`, { limit: 10, windowMs: 60_000 });
  if (!limiter.ok) {
    const retryAfter = Math.max(1, Math.ceil((limiter.resetAt - Date.now()) / 1000));
    return { status: 429, error: `rate limit exceeded (retry after ${retryAfter}s)` };
  }

  log("info", "feedback input", {
    requestId,
    userIdHash: hash8(userId),
    date,
    studyTime,
    tasksCompleted,
    contentLen: content.length,
  });

  // --- plan 取得（無くても動く）
  const planDay = await findPlanDay({ userId, date, requestId });
  const plannedTasks = planDay?.tasks?.length ?? 0;

  // plannedTasks=0 のときは null（0除算防止）でOK。UI表示もしない方針OK。
  const completionRate =
    plannedTasks > 0 && tasksCompleted != null
      ? Math.min(1, Math.max(0, tasksCompleted / plannedTasks))
      : null;

  const system = buildFeedbackSystemPrompt();
  const user = buildFeedbackUserPrompt({
    date,
    content,
    studyTime,
    tasksCompleted,
    planDay,
    completionRate,
  });

  // --- OpenAI client（Secrets経由）※このservice内で env を読まない
  const client = await createOpenAiClient();

  // タイムアウトは短めでOK（UX優先）
  const timeoutMs = Number(process.env.FEEDBACK_API_TIMEOUT_MS ?? "8000");

  try {
    const completion = await withTimeout(
      (signal) =>
        client.chat.completions.create(
          {
            model: MODEL,
            max_completion_tokens: 240,
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
          },
          { signal },
        ),
      Number.isFinite(timeoutMs) ? Math.min(Math.max(timeoutMs, 1000), 60000) : 8000,
    );

    const commentText = completion.choices?.[0]?.message?.content?.trim() ?? "";
    if (!commentText) {
      log("warn", "feedback empty completion", {
        requestId,
        userIdHash: hash8(userId),
        date,
        finishReason: completion.choices?.[0]?.finish_reason,
        model: completion.model,
      });
      return { comment: "コメントを取得できませんでした（AI応答が空でした）。" };
    }

    log("info", "feedback success", {
      requestId,
      userIdHash: hash8(userId),
      date,
      chars: commentText.length,
      hasPlan: Boolean(planDay),
    });

    return { comment: commentText };
  } catch (e) {
    // タイムアウトは “失敗” 扱いにしない（200で固定文返し）
    if (isAbortError(e) || String((e as any)?.message ?? e).toLowerCase().includes("aborted")) {
      return { comment: "今日はここまででも十分！次は計画と照らして1点だけ復習しよう。" };
    }

    log("error", "feedback error", { requestId, userIdHash: hash8(userId), error: String(e) });
    return { status: 500, error: "AIコメント生成に失敗しました" } satisfies ServiceError;
  }
}
