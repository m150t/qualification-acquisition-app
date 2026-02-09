// ==================================================
// OpenAI API Key を SecretsManager から取得（aws-sdk v2）
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

  const sm = getSecretsManager();
  const res = await sm.getSecretValue({ SecretId: SECRET_ID }).promise();
  const key = String(res?.SecretString ?? "").trim();

  if (!key) {
    throw new Error(`OpenAI secret not found or empty. SecretId=${SECRET_ID}`);
  }

  cached = { value: key, fetchedAt: Date.now() };
  return key;
}
