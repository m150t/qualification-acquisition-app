// ==================================================
// StudyReports テーブルへの CRUD（DynamoDB）
// - route/service から呼ぶ「DBアクセス層」
// ==================================================

import {
  BatchWriteCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/dynamodb";

const REPORTS_TABLE = process.env.DDB_REPORTS_TABLE || "StudyReports";

export type ReportItem = {
  userId: string;

  // PK: userId
  // SK: date = `${reportDate}#${savedAt}`（同じ日付でも複数保存できる設計）
  date: string;

  // 表示/検索用の日付（YYYY-MM-DD）
  reportDate: string;

  studyTime: number | null;
  tasksCompleted: number | null;
  content: string;

  aiComment: string | null;
  savedAt: string;
};

/** 1件保存（上書きは基本発生しない想定：dateキーがユニークだから） */
export async function putReport(item: ReportItem) {
  await ddb.send(
    new PutCommand({
      TableName: REPORTS_TABLE,
      Item: item,
    }),
  );
}

/** ユーザーの日報一覧（新しい順） */
export async function listReports(userId: string) {
  const res = await ddb.send(
    new QueryCommand({
      TableName: REPORTS_TABLE,
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: { ":uid": userId },
      ScanIndexForward: false, // sort key 降順（新しい順）
    }),
  );

  return (res.Items ?? []) as ReportItem[];
}

/**
 * 同一 reportDate のうち「最新の1件」のキーを返す
 * - PATCH は “その日付の最新の記録にAIコメントを付与する” という仕様になる
 */
export async function findLatestReportKeyByReportDate(userId: string, reportDate: string) {
  const res = await ddb.send(
    new QueryCommand({
      TableName: REPORTS_TABLE,
      KeyConditionExpression: "userId = :uid AND begins_with(#d, :prefix)",
      ExpressionAttributeNames: { "#d": "date" },
      ExpressionAttributeValues: {
        ":uid": userId,
        ":prefix": `${reportDate}#`,
      },
      ScanIndexForward: false,
      Limit: 1,
      ProjectionExpression: "userId, #d",
    }),
  );

  const item = res.Items?.[0] as { userId: string; date: string } | undefined;
  return item ?? null;
}

/** aiComment のみ更新 */
export async function updateAiComment(
  key: { userId: string; date: string },
  aiComment: string,
) {
  await ddb.send(
    new UpdateCommand({
      TableName: REPORTS_TABLE,
      Key: key,
      UpdateExpression: "SET aiComment = :c",
      ExpressionAttributeValues: { ":c": aiComment },
    }),
  );
}

/**
 * ユーザーの日報を全削除（25件バッチ）
 * - Queryでキー一覧を取り、BatchWriteで消す
 */
export async function deleteAllReports(userId: string) {
  const items: Array<{ userId: string; date: string }> = [];
  let lastKey: Record<string, any> | undefined;

  // 全件キー取得（ページング）
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

    if (res.Items) items.push(...(res.Items as any));
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);

  // 25件ずつ削除（UnprocessedItems リトライ最大5回）
  for (let i = 0; i < items.length; i += 25) {
    let unprocessed = items.slice(i, i + 25).map((it) => ({
      DeleteRequest: { Key: { userId: it.userId, date: it.date } },
    }));

    let attempts = 0;
    while (unprocessed.length > 0 && attempts < 5) {
      const res = await ddb.send(
        new BatchWriteCommand({
          RequestItems: { [REPORTS_TABLE]: unprocessed },
        }),
      );
      unprocessed = (res.UnprocessedItems?.[REPORTS_TABLE] as any[]) ?? [];
      attempts += 1;
    }
  }

  return items.length;
}