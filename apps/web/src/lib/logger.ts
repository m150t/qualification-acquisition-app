import crypto from "crypto";

export type LogLevel = "info" | "warn" | "error";

export function hash8(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 8);
}

export function log(level: LogLevel, msg: string, meta: Record<string, unknown> = {}) {
  console[level](JSON.stringify({ level, msg, time: new Date().toISOString(), ...meta }));
}
