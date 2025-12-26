import { NextRequest, NextResponse } from "next/server";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/src/lib/dynamodb";
import type { Certification } from "@/src/lib/certifications";
import { requireAuth } from "@/src/lib/authServer";

const CERTIFICATIONS_TABLE =
  process.env.DDB_CERTIFICATIONS_TABLE || "Certifications";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const certifications: Certification[] = [];
    let lastEvaluatedKey: Record<string, unknown> | undefined;

    do {
      const res = await ddb.send(
        new ScanCommand({
          TableName: CERTIFICATIONS_TABLE,
          ExclusiveStartKey: lastEvaluatedKey,
        }),
      );

      if (Array.isArray(res.Items)) {
        res.Items.forEach((item) => {
          const cert = item as Certification;
          if (cert?.code && cert?.name) {
            certifications.push(cert);
          }
        });
      }

      lastEvaluatedKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (lastEvaluatedKey);

    certifications.sort((a, b) => a.name.localeCompare(b.name, "ja"));

    return NextResponse.json({ certifications });
  } catch (error) {
    console.error("certifications GET error", error);
    return NextResponse.json(
      { error: "failed to load certifications" },
      { status: 500 },
    );
  }
}
