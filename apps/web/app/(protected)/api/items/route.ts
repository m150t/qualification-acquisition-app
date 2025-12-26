import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/src/lib/authServer";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ items: [] });
}
