// ==================================================
// HTTP層：認証して、reports/feedback の service を呼ぶ
// ==================================================
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authServer";
import { requestIdOf, isServiceError } from "@/lib/apiRouteHelpers";
import { generateFeedback } from "@/features/reports/feedback/server/service";

export async function POST(req: NextRequest) {
  const requestId = requestIdOf(req);

  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: "unauthorized", requestId }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  // NOTE: service 側の入力名は input に寄せる
  const res = await generateFeedback({
    requestId,
    userId: auth.userId,
    input: body,
    headers: req.headers,
  });

  if (isServiceError(res)) {
    return NextResponse.json({ error: res.error, requestId }, { status: res.status });
  }
  return NextResponse.json({ ...res, requestId });
}
