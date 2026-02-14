import "server-only";

// ==================================================
// OpenAI API Key を環境変数から取得
// ==================================================

// 取りすぎ防止の簡易キャッシュ（lambda warm想定）
let cached: { value: string; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;
const SECRET_ID = process.env.OPENAI_API_KEY_SECRET_ID ?? "OPENAI_API_KEY";

function getSecretsManager() {
  // `aws-sdk` を静的 import すると依存解決でビルド失敗しやすいため runtime require にする
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const AWS = require("aws-sdk");
  return new AWS.SecretsManager();
}

export async function getOpenAiApiKey(): Promise<string> {
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.value;

  // NOTE:
  // - このファイルは server-only なのでクライアントバンドルに入らない
  // - 鍵はリポジトリに保存せず、実行環境の Secret 注入で渡す
  // - `aws-sdk` / `@aws-sdk/*` をここで import すると Next build で解決失敗するため使わない
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  cached = { value: key, fetchedAt: Date.now() };
  return key;
}
