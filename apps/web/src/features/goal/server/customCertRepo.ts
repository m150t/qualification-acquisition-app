// ==================================================
// “other” の資格名を保存するテーブルへの書き込み。
// ==================================================

import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { ddb } from "@/lib/dynamodb";

const CUSTOM_CERTIFICATIONS_TABLE =
  process.env.DDB_CUSTOM_CERTIFICATIONS_TABLE || "CustomCertifications";

export async function putCustomCertification(params: { userId: string; certName: string }) {
  const { userId, certName } = params;

  await ddb.send(
    new PutCommand({
      TableName: CUSTOM_CERTIFICATIONS_TABLE,
      Item: {
        id: randomUUID(),
        userId,
        certName,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }),
  );
}
