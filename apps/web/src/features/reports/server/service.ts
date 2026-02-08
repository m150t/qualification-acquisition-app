// ==================================================
// Reports のユースケース層（service）
// ==================================================

import { hash8, log } from "@/lib/logger";
import {
  deleteAllReports,
  findLatestReportKeyByReportDate,
  listReports,
  putReport,
  updateAiComment,
} from "./repo";

const MAX_CONTENT_LENGTH = 4000;
const MAX_DATE_LENGTH = 20;
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export type ServiceError = { status: number; error: string };

// ----------------------
// helpers
// ----------------------
function safeNumber(value: unknown): number | null {
  // NOTE: " " は Number("") = 0 になる。嫌なら trim空をnullにする
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n === "number" && Number.isFinite(n)) return n;
  return null;
}

function validateReportDate(date: unknown): string | ServiceError {
  const d = String(date ?? "").trim();
  if (!d) return { status: 400, error: "date is required" };
  if (d.length > MAX_DATE_LENGTH) return { status: 400, error: "date is too long" };
  if (!DATE_ONLY_REGEX.test(d)) return { status: 400, error: "date must be YYYY-MM-DD" };
  return d;
}

function validateAiComment(aiComment: unknown): string | ServiceError {
  const c = String(aiComment ?? "");
  if (!c) return { status: 400, error: "aiComment is required" };
  if (c.length > MAX_CONTENT_LENGTH) return { status: 400, error: "aiComment is too long" };
  return c;
}

function validateNonNegative(name: string, value: number | null): ServiceError | null {
  if (value == null) return null;
  if (value < 0) return { status: 400, error: `${name} must be >= 0` };
  return null;
}

// ----------------------
// usecases
// ----------------------
export async function saveReport(params: { userId: string; body: any; requestId: string }) {
  const { userId, body, requestId } = params;

  const reportDateOrErr = validateReportDate(body?.date);
  if (typeof reportDateOrErr !== "string") return reportDateOrErr;
  const reportDate = reportDateOrErr;

  const studyTime = safeNumber(body?.studyTime);
  const tasksCompleted = safeNumber(body?.tasksCompleted);

  const stErr = validateNonNegative("studyTime", studyTime);
  if (stErr) return stErr;

  const tcErr = validateNonNegative("tasksCompleted", tasksCompleted);
  if (tcErr) return tcErr;

  const content = String(body?.content ?? "").slice(0, MAX_CONTENT_LENGTH).trim();
  if (!content) return { status: 400, error: "content is required" } satisfies ServiceError;

  const savedAt = new Date().toISOString();

  try {
    await putReport({
      userId,
      date: `${reportDate}#${savedAt}`,
      reportDate,
      studyTime,
      tasksCompleted,
      content,
      aiComment: body?.aiComment ?? null,
      savedAt,
    });

    log("info", "reports post success", {
      requestId,
      userIdHash: hash8(userId),
      date: reportDate,
      hasAiComment: Boolean(body?.aiComment),
    });

    return { ok: true, requestId };
  } catch (e) {
    log("error", "reports post error", { requestId, userIdHash: hash8(userId), error: String(e) });
    return { status: 500, error: "failed to save report" } satisfies ServiceError;
  }
}

export async function getReports(params: { userId: string; requestId: string }) {
  const { userId, requestId } = params;

  try {
    const items = await listReports(userId);

    const reports = items.map((item) => {
      const baseDate =
        typeof item.reportDate === "string"
          ? item.reportDate
          : typeof item.date === "string"
            ? item.date.split("#")[0] ?? item.date
            : "";

      // NOTE: 互換のため date は YYYY-MM-DD に寄せる
      // 将来のために rawDate も残しておく（不要なら消してOK）
      const rawDate = typeof item.date === "string" ? item.date : undefined;

      return { ...item, date: baseDate, rawDate };
    });

    log("info", "reports get success", {
      requestId,
      userIdHash: hash8(userId),
      reportCount: reports.length,
    });

    return { reports, requestId };
  } catch (e) {
    log("error", "reports get error", { requestId, userIdHash: hash8(userId), error: String(e) });
    return { status: 500, error: "failed to load reports" } satisfies ServiceError;
  }
}

export async function clearReports(params: { userId: string; requestId: string }) {
  const { userId, requestId } = params;

  try {
    const deleted = await deleteAllReports(userId);

    log("info", "reports delete success", {
      requestId,
      userIdHash: hash8(userId),
      deleted,
    });

    return { ok: true, requestId };
  } catch (e) {
    log("error", "reports delete error", { requestId, userIdHash: hash8(userId), error: String(e) });
    return { status: 500, error: "failed to delete reports" } satisfies ServiceError;
  }
}

export async function patchAiComment(params: { userId: string; body: any; requestId: string }) {
  const { userId, body, requestId } = params;

  const reportDateOrErr = validateReportDate(body?.date);
  if (typeof reportDateOrErr !== "string") return reportDateOrErr;
  const reportDate = reportDateOrErr;

  const aiCommentOrErr = validateAiComment(body?.aiComment);
  if (typeof aiCommentOrErr !== "string") return aiCommentOrErr;
  const aiComment = aiCommentOrErr;

  try {
    const key = await findLatestReportKeyByReportDate(userId, reportDate);
    if (!key) return { status: 404, error: "report not found" } satisfies ServiceError;

    await updateAiComment(key, aiComment);

    log("info", "reports patch success", {
      requestId,
      userIdHash: hash8(userId),
      date: reportDate,
      aiCommentLength: aiComment.length,
    });

    return { ok: true, requestId };
  } catch (e) {
    log("error", "reports patch error", { requestId, userIdHash: hash8(userId), error: String(e) });
    return { status: 500, error: "failed to update report" } satisfies ServiceError;
  }
}
