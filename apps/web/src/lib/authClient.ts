import { fetchAuthSession } from "aws-amplify/auth";

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) {
    throw new Error("認証情報の取得に失敗しました。再度ログインしてください。");
  }
  return { Authorization: `Bearer ${token}` };
}
