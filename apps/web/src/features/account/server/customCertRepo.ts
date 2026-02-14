import { BatchWriteCommand, DeleteCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/dynamodb";

const GOALS_TABLE = process.env.DDB_GOALS_TABLE || "StudyGoals";
const REPORTS_TABLE = process.env.DDB_REPORTS_TABLE || "StudyReports";
const CUSTOM_CERTIFICATIONS_TABLE = process.env.DDB_CUSTOM_CERTIFICATIONS_TABLE || "CustomCertifications";

type Key = Record<string, any>;
type DeleteWriteRequest = { DeleteRequest: { Key: Key } };

async function batchDeleteWithRetry(tableName: string, keys: Key[]) {
  if (!keys.length) return 0;

  // DynamoDB BatchWrite: 25件ずつ + UnprocessedItems のリトライが必須
  const chunks: Key[][] = [];
  for (let i = 0; i < keys.length; i += 25) chunks.push(keys.slice(i, i + 25));

  let deleted = 0;

  for (const chunk of chunks) {
    let unprocessed: DeleteWriteRequest[] = chunk.map((k) => ({ DeleteRequest: { Key: k } }));

    // 最大5回リトライ（指数バックオフ）
    for (let attempt = 0; attempt < 5 && unprocessed.length; attempt++) {
      const res = await ddb.send(
        new BatchWriteCommand({
          RequestItems: { [tableName]: unprocessed },
        }),
      );

      deleted += unprocessed.length;

      const remain = res.UnprocessedItems?.[tableName] ?? [];
      unprocessed = remain
        .map((item) => item.DeleteRequest?.Key)
        .filter((key): key is Key => Boolean(key))
        .map((key) => ({ DeleteRequest: { Key: key } }));

      if (unprocessed.length) {
        const backoffMs = 50 * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }

    // それでも残るなら異常扱い
    if (unprocessed.length) {
      throw new Error(`BatchWriteCommand unprocessed remains: ${unprocessed.length}`);
    }
  }

  return deleted;
}

export async function deleteGoalByUserId(userId: string) {
  await ddb.send(new DeleteCommand({ TableName: GOALS_TABLE, Key: { userId } }));
}

/**
 * Reports: PK=userId, SK=date(= "YYYY-MM-DD#savedAt") を Query で全件取得して削除
 */
export async function deleteAllReportsByUserId(userId: string) {
  const keys: Array<{ userId: string; date: string }> = [];
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

    keys.push(...(((res.Items as any[]) ?? []).map((it) => ({ userId: it.userId, date: it.date }))));

    lastEvaluatedKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastEvaluatedKey);

  await batchDeleteWithRetry(REPORTS_TABLE, keys);
}

/**
 * CustomCertifications:
 * - 現状スキーマ不明で userId Query ができないので Scan+Filter を暫定維持
 * - ただし「UnprocessedItemsリトライ」は必須
 *
 * TODO: テーブル設計を userId PK（or userId GSI）にして Query で消せるようにする
 */
export async function deleteAllCustomCertificationsByUserId(userId: string) {
  const keys: Array<{ id: string }> = [];
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

    keys.push(...(((res.Items as any[]) ?? []).map((it) => ({ id: it.id }))));

    lastEvaluatedKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastEvaluatedKey);

  await batchDeleteWithRetry(CUSTOM_CERTIFICATIONS_TABLE, keys);
}
