// ==================================================
// Certifications service (usecase)
// ==================================================

import { hash8, log } from "@/src/lib/logger";
import { scanAllCertifications } from "./repo";
import { toCertificationListItem } from "./mapper";
import type { ServiceError } from "./types";

export async function listCertifications(params: { userId: string; requestId: string }) {
  const { userId, requestId } = params;

  try {
    const raw = await scanAllCertifications();

    const certifications = raw
      .map(toCertificationListItem)
      .filter((v): v is NonNullable<typeof v> => v !== null)
      .sort((a, b) => a.name.localeCompare(b.name, "ja"));

    log("info", "certifications get success", {
      requestId,
      userIdHash: hash8(userId),
      count: certifications.length,
    });

    return { certifications, requestId };
  } catch (e) {
    log("error", "certifications get error", {
      requestId,
      userIdHash: hash8(userId),
      error: String(e),
    });

    return { status: 500, error: "failed to load certifications" } satisfies ServiceError;
  }
}
