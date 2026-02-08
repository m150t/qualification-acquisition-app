// ==================================================
// Next.js route.ts 用の共通ヘルパ
// - requestId 生成
// - service error 判定
// ==================================================

import crypto from "crypto";
import { NextRequest } from "next/server";

export type ServiceError = { status: number; error: string };

export function requestIdOf(req: NextRequest) {
  return req.headers.get("x-request-id") ?? crypto.randomUUID();
}

export function isServiceError(res: unknown): res is ServiceError {
  return (
    !!res &&
    typeof res === "object" &&
    "status" in res &&
    "error" in res &&
    typeof (res as any).status === "number" &&
    typeof (res as any).error === "string"
  );
}
