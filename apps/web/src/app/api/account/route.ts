import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/src/lib/authServer";
import { isServiceError, requestIdOf } from "@/src/lib/apiRouteHelpers";
import { deleteAccount } from "@/src/features/account/server/service";

export async function DELETE(req: NextRequest) {
  const requestId = requestIdOf(req);

  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: "unauthorized", requestId }, { status: 401 });

  const res = await deleteAccount({ requestId, userId: auth.userId });

  if (isServiceError(res)) return NextResponse.json({ error: res.error, requestId }, { status: res.status });
  return NextResponse.json(res);
}
