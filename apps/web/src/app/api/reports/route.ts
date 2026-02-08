import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authServer";
import { isServiceError, requestIdOf } from "@/lib/apiRouteHelpers";
import { clearReports, getReports, patchAiComment, saveReport } from "@/features/reports/server/service";

export async function POST(req: NextRequest) {
  const requestId = requestIdOf(req);

  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: "unauthorized", requestId }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const res = await saveReport({ userId: auth.userId, body, requestId });

  if (isServiceError(res)) return NextResponse.json({ error: res.error, requestId }, { status: res.status });
  return NextResponse.json(res);
}

export async function GET(req: NextRequest) {
  const requestId = requestIdOf(req);

  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: "unauthorized", requestId }, { status: 401 });

  const res = await getReports({ userId: auth.userId, requestId });

  if (isServiceError(res)) return NextResponse.json({ error: res.error, requestId }, { status: res.status });
  return NextResponse.json(res);
}

export async function DELETE(req: NextRequest) {
  const requestId = requestIdOf(req);

  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: "unauthorized", requestId }, { status: 401 });

  const res = await clearReports({ userId: auth.userId, requestId });

  if (isServiceError(res)) return NextResponse.json({ error: res.error, requestId }, { status: res.status });
  return NextResponse.json(res);
}

export async function PATCH(req: NextRequest) {
  const requestId = requestIdOf(req);

  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: "unauthorized", requestId }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const res = await patchAiComment({ userId: auth.userId, body, requestId });

  if (isServiceError(res)) return NextResponse.json({ error: res.error, requestId }, { status: res.status });
  return NextResponse.json(res);
}
