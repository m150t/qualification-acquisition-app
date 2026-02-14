import "server-only";

// ==================================================
// OpenAI API Key を環境変数から取得（server-only）
// ==================================================

// 取りすぎ防止の簡易キャッシュ（lambda warm想定）
let cached: { value: string; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function getOpenAiApiKey(): Promise<string> {
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.value;

  // NOTE:
  // - このファイルは server-only なのでクライアントバンドルに入らない
  // - 鍵はリポジトリに保存せず、実行環境の Secret 注入で渡す
  // - 依存追加なしで server-side の secret 注入値のみを扱う
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  cached = { value: key, fetchedAt: Date.now() };
  return key;
}
