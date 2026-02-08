import { hash8, log } from "@/lib/logger";
import { deleteGoalByUserId } from "./repo";
import { deleteAllReportsByUserId } from "./repo";
import { deleteAllCustomCertificationsByUserId } from "./repo";

export type ServiceError = { status: number; error: string };

export async function deleteAccount(params: { requestId: string; userId: string }) {
  const { requestId, userId } = params;

  // NOTE: 退会は「できるだけ消す」だが、失敗を握りつぶして成功にするのはダメ
  // まずは best-effort で全部走らせ、結果を見て 500 にする（厳しめ）
  const results = await Promise.allSettled([
    deleteGoalByUserId(userId),
    deleteAllReportsByUserId(userId),
    deleteAllCustomCertificationsByUserId(userId),
  ]);

  const failures = results
    .map((r, i) => ({ r, i }))
    .filter((x) => x.r.status === "rejected");

  if (failures.length > 0) {
    log("error", "account delete partial failure", {
      requestId,
      userIdHash: hash8(userId),
      failedCount: failures.length,
      reasons: failures.map((f) => String((f.r as PromiseRejectedResult).reason)),
    });
    return { status: 500, error: "failed to delete account data" } satisfies ServiceError;
  }

  log("info", "account delete success", { requestId, userIdHash: hash8(userId) });
  return { ok: true, requestId };
}
