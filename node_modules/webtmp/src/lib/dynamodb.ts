// apps/web/src/lib/dynamodb.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const region = process.env.DDB_REGION || 'ap-northeast-1';

const hasExplicitCreds =
  !!process.env.DDB_ACCESS_KEY_ID && !!process.env.DDB_SECRET_ACCESS_KEY;

const client = new DynamoDBClient({
  region,
  // ローカル & Amplify ともに、環境変数を見てあればそれを使う
  // 無ければ default provider (プロファイル / ロール) にフォールバック
  credentials: hasExplicitCreds
    ? {
        accessKeyId: process.env.DDB_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.DDB_SECRET_ACCESS_KEY as string,
      }
    : undefined,
});

export const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});
