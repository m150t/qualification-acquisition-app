type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

type RateLimitState = {
  count: number;
  resetAt: number;
};

const limiterStore = new Map<string, RateLimitState>();

export function rateLimit(key: string, options: RateLimitOptions) {
  const now = Date.now();
  const current = limiterStore.get(key);

  if (!current || current.resetAt <= now) {
    limiterStore.set(key, { count: 1, resetAt: now + options.windowMs });
    return { ok: true, remaining: options.limit - 1, resetAt: now + options.windowMs };
  }

  if (current.count >= options.limit) {
    return { ok: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  limiterStore.set(key, current);
  return { ok: true, remaining: options.limit - current.count, resetAt: current.resetAt };
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return headers.get("x-real-ip") ?? "unknown";
}
