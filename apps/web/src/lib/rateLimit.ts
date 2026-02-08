const store = new Map<string, { count: number; resetAt: number }>();

type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const rip = headers.get("x-real-ip")?.trim();
  return xff || rip || "unknown";
}

export function rateLimit(key: string, options: RateLimitOptions) {
  const now = Date.now();
  const prev = store.get(key);

  if (!prev || now >= prev.resetAt) {
    const next = { count: 1, resetAt: now + options.windowMs };
    store.set(key, next);
    return { ok: true as const, remaining: Math.max(0, options.limit - 1), resetAt: next.resetAt };
  }

  const count = prev.count + 1;
  const next = { count, resetAt: prev.resetAt };
  store.set(key, next);

  return {
    ok: count <= options.limit,
    remaining: Math.max(0, options.limit - count),
    resetAt: next.resetAt,
  };
}
