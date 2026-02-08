// ==================================================
// HTTP層：plan（学習計画生成）
// - 認証
// - 入力取得
// - service 呼び出し
// - service error を HTTP に変換
// ==================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authServer";
import { isServiceError, requestIdOf } from "@/lib/apiRouteHelpers";
import { generatePlan } from "@/features/goal/plan/server/generatePlan";

export async function POST(req: NextRequest) {
  const requestId = requestIdOf(req);

  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: "unauthorized", requestId }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const res = await generatePlan({ requestId, userId: auth.userId, body });

  if (isServiceError(res)) return NextResponse.json({ error: res.error, requestId }, { status: res.status });
  return NextResponse.json(res);
}

