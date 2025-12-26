import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  BatchWriteCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/src/lib/dynamodb";
import { requireAuth } from "@/src/lib/authServer";
import { hash8, log } from "@/src/lib/logger";

const GOALS_TABLE = process.env.DDB_GOALS_TABLE || "StudyGoals";
const REPORTS_TABLE = process.env.DDB_REPORTS_TABLE || "StudyReports";
const CUSTOM_CERTIFICATIONS_TABLE =
  process.env.DDB_CUSTOM_CERTIFICATIONS_TABLE || "CustomCertifications";

async function deleteReports(userId: string) {
  const items: Array<{ userId: string; date: string }> = [];
  let lastEvaluatedKey: Record<string, unknown> | undefined;
  do {
    const res = await ddb.send(
      new QueryCommand({
        TableName: REPORTS_TABLE,
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: { ":uid": userId },
        ProjectionExpression: "userId, #d",
        ExpressionAttributeNames: { "#d": "date" },
        ExclusiveStartKey: lastEvaluatedKey,
      }),
    );
    items.push(...((res.Items as Array<{ userId: string; date: string }>) ?? []));
    lastEvaluatedKey = res.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  if (!items.length) return;

  const batches: typeof items[] = [];
  for (let i = 0; i < items.length; i += 25) {
    batches.push(items.slice(i, i + 25));
  }

  for (const batch of batches) {
    await ddb.send(
      new BatchWriteCommand({
        RequestItems: {
          [REPORTS_TABLE]: batch.map((it) => ({
            DeleteRequest: { Key: { userId: it.userId, date: it.date } },
          })),
        },
      }),
    );
  }
}

async function deleteCustomCertifications(userId: string) {
  const items: Array<{ id: string }> = [];
  let lastEvaluatedKey: Record<string, unknown> | undefined;
  do {
    const res = await ddb.send(
      new ScanCommand({
        TableName: CUSTOM_CERTIFICATIONS_TABLE,
        FilterExpression: "userId = :uid",
        ExpressionAttributeValues: { ":uid": userId },
        ProjectionExpression: "id",
        ExclusiveStartKey: lastEvaluatedKey,
      }),
    );
    items.push(...((res.Items as Array<{ id: string }>) ?? []));
    lastEvaluatedKey = res.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  if (!items.length) return;

  const batches: typeof items[] = [];
  for (let i = 0; i < items.length; i += 25) {
    batches.push(items.slice(i, i + 25));
  }

  for (const batch of batches) {
    await ddb.send(
      new BatchWriteCommand({
        RequestItems: {
          [CUSTOM_CERTIFICATIONS_TABLE]: batch.map((it) => ({
            DeleteRequest: { Key: { id: it.id } },
          })),
        },
      }),
    );
  }
}

// DELETE: アカウント退会（全データ削除）
export async function DELETE(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    await Promise.allSettled([
      ddb.send(
        new DeleteCommand({
          TableName: GOALS_TABLE,
          Key: { userId: auth.userId },
        }),
      ),
      deleteReports(auth.userId),
      deleteCustomCertifications(auth.userId),
    ]);

    log("info", "account delete success", { requestId, userIdHash: hash8(auth.userId) });
    return NextResponse.json({ ok: true, requestId });
  } catch (error) {
    log("error", "account DELETE error", { requestId, error: String(error) });
    return NextResponse.json({ error: "failed to delete account data", requestId }, { status: 500 });
  }
}
