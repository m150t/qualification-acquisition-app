import crypto from "crypto";

export type LogLevel = "info" | "warn" | "error";

export function hash8(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 8);
}

const REDACTED = "[REDACTED]";

const ENV_KEYS_TO_REDACT = [
  // OpenAI
  "OPENAI_API_KEY",
  // AWS
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_SESSION_TOKEN",
] as const;

const SENSITIVE_META_KEYS = [
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "password",
  "token",
  "secret",
] as const;

// ---- secrets cache
let cachedSecrets: string[] | null = null;

function buildSecretValuesOnce(): string[] {
  if (cachedSecrets) return cachedSecrets;
  if (typeof process === "undefined" || !process.env) return (cachedSecrets = []);
  cachedSecrets = ENV_KEYS_TO_REDACT
    .map((key) => process.env[key])
    .filter((v): v is string => typeof v === "string" && v.length > 0);
  return cachedSecrets;
}

function redactString(value: string, secrets: string[]): string {
  let result = value;

  // "KEY=xxxxx" 形式で入ってくるやつを潰す
  for (const key of ENV_KEYS_TO_REDACT) {
    const re = new RegExp(`${key}=[^\\s"]+`, "g");
    result = result.replace(re, `${key}=${REDACTED}`);
  }

  // 値そのものが混ざってたら潰す（最重要）
  for (const secret of secrets) {
    if (secret.length < 6) continue;
    result = result.split(secret).join(REDACTED);
  }

  return result;
}

function sanitizeLogValue(value: unknown, secrets: string[], seen: WeakSet<object>): unknown {
  if (typeof value === "string") return redactString(value, secrets);

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLogValue(item, secrets, seen));
  }

  if (value && typeof value === "object") {
    if (seen.has(value)) return "[Circular]";
    seen.add(value);

    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = sanitizeLogValue(v, secrets, seen);
    }
    return out;
  }

  return value;
}

function isSensitiveMetaKey(key: string): boolean {
  const lowered = key.toLowerCase();
  return SENSITIVE_META_KEYS.some((sensitiveKey) => lowered.includes(sensitiveKey));
}

function sanitizeMeta(meta: Record<string, unknown>, secrets: string[]): Record<string, unknown> {
  const seen = new WeakSet<object>();
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(meta)) {
    out[key] = isSensitiveMetaKey(key)
      ? REDACTED
      : sanitizeLogValue(value, secrets, seen);
  }

  return out;
}

export function log(level: LogLevel, msg: string, meta: Record<string, unknown> = {}) {
  const secrets = buildSecretValuesOnce();
  const sanitized = sanitizeMeta(meta, secrets);

  // console[level] が存在しない環境の保険
  const fn = console[level] ?? console.log;
  fn(
    JSON.stringify({
      level,
      msg,
      time: new Date().toISOString(),
      meta: sanitized,
    }),
  );
}
