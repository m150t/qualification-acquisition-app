// ==================================================
// REPORTS_TABLE の “全削除” だけを担う。
// ==================================================

import { BatchWriteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/dynamodb";
import { hash8, log } from "@/lib/logger";

const REPORTS_TABLE = process.env.DDB_REPORTS_TABLE || "StudyReports";

export async function deleteAllReportsForUser(params: {
  userId: string;
  requestId: string;
}) {
  const { userId, requestId } = params;

  const items: Array<{ userId: string; date: string }> = [];
  let lastKey: Record<string, any> | undefined;

  // 1) 全件取得（Projectionでキーだけに絞る）
  do {
    const res = await ddb.send(
      new QueryCommand({
        TableName: REPORTS_TABLE,
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: { ":uid": userId },
        ProjectionExpression: "userId, #d",
        ExpressionAttributeNames: { "#d": "date" },
        ExclusiveStartKey: lastKey,
      }),
    );
    if (res.Items) items.push(...(res.Items as Array<{ userId: string; date: string }>));
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);

  if (!items.length) {
    log("info", "reports delete empty", { requestId, userIdHash: hash8(userId) });
    return 0;
  }

  // 2) 25件ずつ削除（DDBの制限）
  const batches: typeof items[] = [];
  for (let i = 0; i < items.length; i += 25) {
    batches.push(items.slice(i, i + 25));
  }

  // 3) UnprocessedItems が返ることがあるのでリトライ
  for (const batch of batches) {
    let unprocessed = batch.map((it) => ({
      DeleteRequest: { Key: { userId: it.userId, date: it.date } },
    }));

    let attempts = 0;
    while (unprocessed.length > 0 && attempts < 5) {
      const res = await ddb.send(
        new BatchWriteCommand({
          RequestItems: { [REPORTS_TABLE]: unprocessed },
        }),
      );
      unprocessed =
        (res.UnprocessedItems?.[REPORTS_TABLE] as typeof unprocessed | undefined) ?? [];
      attempts += 1;
    }
  }

  log("info", "reports delete success", { requestId, userIdHash: hash8(userId), deleted: items.length });
  return items.length;
}
