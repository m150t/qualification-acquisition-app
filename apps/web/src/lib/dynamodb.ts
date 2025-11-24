// apps/web/src/lib/dynamodb.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Amplify の環境変数側で APP_REGION を設定しておく（例: ap-northeast-1）
const REGION = process.env.APP_REGION || 'ap-northeast-1';

const client = new DynamoDBClient({
  region: REGION,
  // ★ IAMロールを使うので credentials は一切指定しない
  // credentials を指定しなければ、Lambda/Amplify の実行ロールから自動取得される
});

export const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});
