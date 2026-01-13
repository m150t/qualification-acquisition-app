import crypto from "crypto";

export type LogLevel = "info" | "warn" | "error";

export function hash8(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 8);
}

const REDACTED = "[REDACTED]";
const ENV_KEYS_TO_REDACT = [
  "OPENAI_API_KEY",
  "DDB_ACCESS_KEY_ID",
  "DDB_SECRET_ACCESS_KEY",
];

function buildSecretValues(): string[] {
  if (typeof process === "undefined" || !process.env) return [];
  return ENV_KEYS_TO_REDACT.map((key) => process.env[key])
    .filter((value): value is string => typeof value === "string" && value.length > 0);
}

function redactString(value: string, secrets: string[]): string {
  let result = value.replace(/OPENAI_API_KEY=[^\s"]+/g, `OPENAI_API_KEY=${REDACTED}`);
  for (const secret of secrets) {
    if (secret.length < 6) continue;
    result = result.split(secret).join(REDACTED);
  }
  return result;
}

function sanitizeLogValue(value: unknown, secrets: string[], seen: WeakSet<object>): unknown {
  if (typeof value === "string") {
    return redactString(value, secrets);
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLogValue(item, secrets, seen));
  }
  if (value && typeof value === "object") {
    if (seen.has(value)) return "[Circular]";
    seen.add(value);
    const entries = Object.entries(value as Record<string, unknown>).map(([key, val]) => [
      key,
      sanitizeLogValue(val, secrets, seen),
    ]);
    return Object.fromEntries(entries);
  }
  return value;
}

export function log(level: LogLevel, msg: string, meta: Record<string, unknown> = {}) {
  const secrets = buildSecretValues();
  const sanitized = sanitizeLogValue(meta, secrets, new WeakSet());
  console[level](JSON.stringify({ level, msg, time: new Date().toISOString(), meta: sanitized }));
}
