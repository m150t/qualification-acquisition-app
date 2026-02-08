// ==================================================
// Certifications テーブルから「試験ガイド」を取る
// ==================================================
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/src/lib/dynamodb";
import type { ExamGuide } from "./types";

const CERTIFICATIONS_TABLE = process.env.DDB_CERTIFICATIONS_TABLE || "Certifications";

export async function getExamGuideByCode(certCode?: string): Promise<ExamGuide | null> {
  if (!certCode) return null;

  const res = await ddb.send(
    new GetCommand({
      TableName: CERTIFICATIONS_TABLE,
      Key: { code: certCode },
      ProjectionExpression: "examGuide, examGuideText",
    }),
  );

  const item = res.Item as { examGuide?: ExamGuide; examGuideText?: string } | undefined;
  return item?.examGuide ?? item?.examGuideText ?? null;
}
