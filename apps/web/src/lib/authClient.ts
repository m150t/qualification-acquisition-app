import { fetchAuthSession } from "aws-amplify/auth";

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const session = await fetchAuthSession();

  // API認証は access token が基本
  const accessToken = session.tokens?.accessToken?.toString();
  if (accessToken) {
    return { Authorization: `Bearer ${accessToken}` };
  }

  // フォールバック（UI上の都合で idToken しか無いケースを救う）
  const idToken = session.tokens?.idToken?.toString();
  if (idToken) {
    return { Authorization: `Bearer ${idToken}` };
  }

  throw new Error("認証情報の取得に失敗しました。再度ログインしてください。");
}
