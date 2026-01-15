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
  "AWS_SECRET_ACCESS_KEY",
  "AWS_ACCESS_KEY_ID",
];

function buildSecretValues(): string[] {
  if (typeof process === "undefined" || !process.env) return [];
  return ENV_KEYS_TO_REDACT.map((key) => process.env[key])
    .filter((value): value is string => typeof value === "string" && value.length > 0);
}

function redactString(value: string, secrets: string[]): string {
  let result = maybeRedactBase64(value, secrets);
  result = result.replace(/OPENAI_API_KEY=[^\s"]+/g, `OPENAI_API_KEY=${REDACTED}`);
  result = result.replace(/AWS_SECRET_ACCESS_KEY=[^\s"]+/g, `AWS_SECRET_ACCESS_KEY=${REDACTED}`);
  result = result.replace(/AWS_ACCESS_KEY_ID=[^\s"]+/g, `AWS_ACCESS_KEY_ID=${REDACTED}`);
  for (const secret of secrets) {
    if (secret.length < 6) continue;
    result = result.split(secret).join(REDACTED);
  }
  return result;
}

function maybeRedactBase64(value: string, secrets: string[]): string {
  if (!value || value.length < 40) return value;
  if (!/^[A-Za-z0-9+/=]+$/.test(value)) return value;
  if (typeof Buffer === "undefined") return value;
  try {
    const decoded = Buffer.from(value, "base64").toString("utf8");
    if (!decoded) return value;
    const hasEnvName = ENV_KEYS_TO_REDACT.some((key) => decoded.includes(`${key}=`));
    const hasSecret = secrets.some((secret) => secret.length >= 6 && decoded.includes(secret));
    return hasEnvName || hasSecret ? REDACTED : value;
  } catch {
    return value;
  }
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
