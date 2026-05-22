// ==================================================
// Certifications table access (repo)
// ==================================================

import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/dynamodb";
import type { CertificationDto } from "./dto";

const CERTIFICATIONS_TABLE = process.env.DDB_CERTIFICATIONS_TABLE || "Certifications";

type CertificationRecord = {
  code?: unknown;
  name?: unknown;
  provider?: unknown;
  defaultWeeklyHours?: unknown;
  defaultWeeks?: unknown;
  examGuide?: unknown;
};

export async function listCertifications(): Promise<CertificationDto[]> {
  const items: CertificationDto[] = [];
  let lastEvaluatedKey: Record<string, unknown> | undefined;

  do {
    const res = await ddb.send(
      new ScanCommand({
        TableName: CERTIFICATIONS_TABLE,
        ExclusiveStartKey: lastEvaluatedKey,
        ProjectionExpression: "#c, #n, #p, #dwh, #dw, #eg",
        ExpressionAttributeNames: {
          "#c": "code",
          "#n": "name",
          "#p": "provider",
          "#dwh": "defaultWeeklyHours",
          "#dw": "defaultWeeks",
          "#eg": "examGuide",
        },
      }),
    );

    for (const it of (res.Items ?? []) as CertificationRecord[]) {
      const code = it.code;
      const name = it.name;
      if (typeof code === "string" && typeof name === "string") {
        const provider = typeof it.provider === "string" ? it.provider : undefined;
        const defaultWeeklyHours =
          typeof it.defaultWeeklyHours === "number" ? it.defaultWeeklyHours : undefined;
        const defaultWeeks = typeof it.defaultWeeks === "number" ? it.defaultWeeks : undefined;
        const examGuide = it.examGuide;

        items.push({ code, name, provider, defaultWeeklyHours, defaultWeeks, examGuide });
      }
    }
    lastEvaluatedKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastEvaluatedKey);

  items.sort((a, b) => a.name.localeCompare(b.name, "ja"));
  return items;
}

// Backward-compatible alias for existing service import
export const scanAllCertifications = listCertifications;
