// ==================================================
// Certifications table access (repo)
// ==================================================

import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/dynamodb";
import { CertificationDto } from "./dto";

const CERTIFICATIONS_TABLE = process.env.DDB_CERTIFICATIONS_TABLE || "Certifications";

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

    for (const it of res.Items ?? []) {
      const code = (it as any)?.code;
      const name = (it as any)?.name;
      if (typeof code === "string" && typeof name === "string") {
        const provider = typeof (it as any)?.provider === "string" ? (it as any).provider : undefined;
        const defaultWeeklyHours =
          typeof (it as any)?.defaultWeeklyHours === "number" ? (it as any).defaultWeeklyHours : undefined;
        const defaultWeeks = typeof (it as any)?.defaultWeeks === "number" ? (it as any).defaultWeeks : undefined;
        const examGuide = (it as any)?.examGuide;

        items.push({ code, name, provider, defaultWeeklyHours, defaultWeeks, examGuide });
      }
    }
    lastEvaluatedKey = res.LastEvaluatedKey as any;
  } while (lastEvaluatedKey);

  items.sort((a, b) => a.name.localeCompare(b.name, "ja"));
  return items;
}

// Backward-compatible alias for existing service import
export const scanAllCertifications = listCertifications;
