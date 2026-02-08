// ==================================================
// OpenAI呼び出しのタイムアウト制御（AbortController）
// ==================================================
export function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: string }).name === "AbortError"
  );
}

/**
 * AbortController 付きで async を実行する
 * - Next.js route は “ぶら下がり” しやすいのでガード必須
 */
export async function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);

  try {
    return await fn(ac.signal);
  } finally {
    clearTimeout(timer);
  }
}
