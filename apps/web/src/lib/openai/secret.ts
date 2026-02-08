// ==================================================
// OpenAI API Key を Secrets Manager から取得
// ==================================================
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

// SecretId は環境差分で変わるので env でOK（鍵本体じゃない）
const SECRET_ID = process.env.OPENAI_API_KEY_SECRET_ID ?? "OPENAI_API_KEY";

// 取りすぎ防止の簡易キャッシュ（lambda warm想定）
let cached: { value: string; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function getOpenAiApiKey(): Promise<string> {
  // キャッシュが生きてたらそれを返す
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.value;

  const client = new SecretsManagerClient({}); // regionはAWS環境が持つので通常不要
  const res = await client.send(new GetSecretValueCommand({ SecretId: SECRET_ID }));

  const secret = res.SecretString?.trim();
  if (!secret) {
    throw new Error(`OpenAI secret not found or empty. SecretId=${SECRET_ID}`);
  }

  cached = { value: secret, fetchedAt: Date.now() };
  return secret;
}
