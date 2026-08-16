import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/dynamodb";

const TABLE_NAME = process.env.DDB_GOALS_TABLE ?? "StudyGoals";

export type PushSubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function savePushSubscription(userId: string, subscription: PushSubscriptionInput): Promise<void> {
  const existing = await getSubscriptions(userId);
  // 同じ端末で再購読した場合は古い鍵を置き換え、重複通知を防ぐ。
  const subscriptions = [...existing.filter((item) => item.endpoint !== subscription.endpoint), subscription];
  await ddb.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { userId },
    UpdateExpression: "SET pushSubscriptions = :subscriptions",
    ExpressionAttributeValues: { ":subscriptions": subscriptions },
  }));
}

export async function deletePushSubscription(userId: string, endpoint: string): Promise<void> {
  // ほかの端末の購読は維持し、指定された配信先だけを削除する。
  const subscriptions = (await getSubscriptions(userId)).filter((item) => item.endpoint !== endpoint);
  await ddb.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { userId },
    UpdateExpression: "SET pushSubscriptions = :subscriptions",
    ExpressionAttributeValues: { ":subscriptions": subscriptions },
  }));
}

async function getSubscriptions(userId: string): Promise<PushSubscriptionInput[]> {
  const result = await ddb.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { userId },
    ProjectionExpression: "pushSubscriptions",
  }));
  return Array.isArray(result.Item?.pushSubscriptions)
    ? result.Item.pushSubscriptions as PushSubscriptionInput[]
    : [];
}
