// apps/web/src/lib/dynamodb.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const REGION = process.env.AWS_REGION || 'ap-northeast-1';

const client = new DynamoDBClient({
  region: REGION,
  // 認証情報は環境依存（ローカルなら ~/.aws/credentials や SSO）
  // ここでは default provider に任せる
});

export const ddbDocClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});
