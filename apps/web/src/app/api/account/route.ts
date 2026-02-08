import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authServer";
import { isServiceError, requestIdOf } from "@/lib/apiRouteHelpers";
import { deleteAccount } from "@/features/account/server/service";

export async function DELETE(req: NextRequest) {
  const requestId = requestIdOf(req);

  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: "unauthorized", requestId }, { status: 401 });

  const res = await deleteAccount({ requestId, userId: auth.userId });

  if (isServiceError(res)) return NextResponse.json({ error: res.error, requestId }, { status: res.status });
  return NextResponse.json(res);
}
