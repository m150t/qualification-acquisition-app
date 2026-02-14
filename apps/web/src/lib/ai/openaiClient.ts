import { createOpenAiClient } from "./client";

export async function getOpenAiClient() {
  return createOpenAiClient();
}
