import { BatchWriteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/src/lib/dynamodb";

type ReportKey = {
  userId: string;
  date: string;
};

type DeleteReportResult = {
  deleted: number;
  unprocessed: number;
};

const MAX_BATCH_SIZE = 25;
const MAX_RETRIES = 5;
const BASE_RETRY_MS = 200;

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function listReportKeys(userId: string, tableName: string): Promise<ReportKey[]> {
  const keys: ReportKey[] = [];
  let lastKey: Record<string, unknown> | undefined;

  do {
    const res = await ddb.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: { ":uid": userId },
        ProjectionExpression: "userId, #d",
        ExpressionAttributeNames: { "#d": "date" },
        ExclusiveStartKey: lastKey,
      }),
    );

    (res.Items ?? []).forEach((item) => {
      if (typeof item.userId === "string" && typeof item.date === "string") {
        keys.push({ userId: item.userId, date: item.date });
      }
    });

    lastKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);

  return keys;
}

async function batchDeleteKeys(
  tableName: string,
  keys: ReportKey[],
): Promise<DeleteReportResult> {
  let deleted = 0;
  let unprocessed = 0;

  for (const batch of chunk(keys, MAX_BATCH_SIZE)) {
    let pending = batch.map((key) => ({
      DeleteRequest: { Key: { userId: key.userId, date: key.date } },
    }));
    let attempt = 0;

    while (pending.length > 0 && attempt <= MAX_RETRIES) {
      const res = await ddb.send(
        new BatchWriteCommand({
          RequestItems: {
            [tableName]: pending,
          },
        }),
      );

      const retry = res.UnprocessedItems?.[tableName] ?? [];
      const processed = pending.length - retry.length;
      deleted += processed;
      pending = retry;

      if (pending.length === 0) break;

      attempt += 1;
      if (attempt <= MAX_RETRIES) {
        await sleep(BASE_RETRY_MS * attempt);
      }
    }

    if (pending.length > 0) {
      unprocessed += pending.length;
    }
  }

  return { deleted, unprocessed };
}

export async function deleteReportsForUser(
  userId: string,
  tableName: string,
): Promise<DeleteReportResult> {
  const keys = await listReportKeys(userId, tableName);
  if (keys.length === 0) return { deleted: 0, unprocessed: 0 };
  return batchDeleteKeys(tableName, keys);
}
