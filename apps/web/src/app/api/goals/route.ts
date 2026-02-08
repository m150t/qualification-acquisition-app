// ==================================================
// HTTP層：goal の service を呼ぶ（薄く保つ）
// - 認証
// - 入力取得
// - service 呼び出し
// - service error を HTTP に変換
// ==================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authServer";
import { isServiceError, requestIdOf } from "@/lib/apiRouteHelpers";
import { deleteGoal, getGoal, postponePlanDay, saveGoal } from "@/features/goal/server/service";

export async function POST(req: NextRequest) {
  const requestId = requestIdOf(req);

  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: "unauthorized", requestId }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const res = await saveGoal({ requestId, userId: auth.userId, body });

  if (isServiceError(res)) return NextResponse.json({ error: res.error, requestId }, { status: res.status });
  return NextResponse.json(res);
}

export async function GET(req: NextRequest) {
  const requestId = requestIdOf(req);

  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: "unauthorized", requestId }, { status: 401 });

  const res = await getGoal({ requestId, userId: auth.userId });

  if (isServiceError(res)) return NextResponse.json({ error: res.error, requestId }, { status: res.status });
  return NextResponse.json(res);
}

export async function PATCH(req: NextRequest) {
  const requestId = requestIdOf(req);

  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: "unauthorized", requestId }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const date = typeof body.date === "string" ? body.date.trim() : "";
  if (!date) return NextResponse.json({ error: "date is required", requestId }, { status: 400 });

  const res = await postponePlanDay({ requestId, userId: auth.userId, date });

  if (isServiceError(res)) return NextResponse.json({ error: res.error, requestId }, { status: res.status });
  return NextResponse.json(res);
}

export async function DELETE(req: NextRequest) {
  const requestId = requestIdOf(req);

  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: "unauthorized", requestId }, { status: 401 });

  const res = await deleteGoal({ requestId, userId: auth.userId });

  if (isServiceError(res)) return NextResponse.json({ error: res.error, requestId }, { status: res.status });
  return NextResponse.json(res);
}
