import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/authServer";
import { requestIdOf } from "@/lib/apiRouteHelpers";
import { hash8, log } from "@/lib/logger";
import { listCertifications } from "@/features/certifications/server/repo";

export async function GET(req: NextRequest) {
  const requestId = requestIdOf(req);

  try {
    const auth = await requireAuth(req);
    if (!auth) return NextResponse.json({ error: "unauthorized", requestId }, { status: 401 });

    const certifications = await listCertifications();

    log("info", "certifications get success", {
      requestId,
      userIdHash: hash8(auth.userId),
      count: certifications.length,
    });

    return NextResponse.json({ certifications, requestId });
  } catch (error) {
    log("error", "certifications GET error", { requestId, error: String(error) });
    return NextResponse.json({ error: "failed to load certifications", requestId }, { status: 500 });
  }
}
