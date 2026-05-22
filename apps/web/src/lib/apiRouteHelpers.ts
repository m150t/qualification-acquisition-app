// ==================================================
// Next.js route.ts 用の共通ヘルパ
// - requestId 生成
// - service error 判定
// ==================================================

import crypto from "crypto";
import type { NextRequest } from "next/server";

export type ServiceError = { status: number; error: string };

type ServiceErrorCandidate = {
  status?: unknown;
  error?: unknown;
};

export function requestIdOf(req: NextRequest) {
  return req.headers.get("x-request-id") ?? crypto.randomUUID();
}

export function isServiceError(res: unknown): res is ServiceError {
  if (!res || typeof res !== "object") return false;

  const candidate = res as ServiceErrorCandidate;
  return typeof candidate.status === "number" && typeof candidate.error === "string";
}
