// ==================================================
// OpenAI client 生成
// ==================================================
import OpenAI from "openai";
import { getOpenAiApiKey } from "./secret";

export async function createOpenAiClient() {
  const apiKey = await getOpenAiApiKey();
  return new OpenAI({ apiKey });
}
