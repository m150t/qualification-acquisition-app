// apps/web/app/api/account/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  BatchWriteCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { ddb } from '@/src/lib/dynamodb';

const GOALS_TABLE = process.env.DDB_GOALS_TABLE || 'StudyGoals';
const REPORTS_TABLE = process.env.DDB_REPORTS_TABLE || 'StudyReports';
const CUSTOM_CERTIFICATIONS_TABLE =
  process.env.DDB_CUSTOM_CERTIFICATIONS_TABLE || 'CustomCertifications';

function getUserId(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return null;
  }
  return userId;
}

async function deleteReports(userId: string) {
  const res = await ddb.send(
    new QueryCommand({
      TableName: REPORTS_TABLE,
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
      ProjectionExpression: 'userId, #d',
      ExpressionAttributeNames: { '#d': 'date' },
    }),
  );

  const items = res.Items ?? [];
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
  const res = await ddb.send(
    new ScanCommand({
      TableName: CUSTOM_CERTIFICATIONS_TABLE,
      FilterExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
    }),
  );

  const items = res.Items ?? [];
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
  try {
    const userId = getUserId(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'userId header is required' },
        { status: 401 },
      );
    }

    await Promise.allSettled([
      ddb.send(
        new DeleteCommand({
          TableName: GOALS_TABLE,
          Key: { userId },
        }),
      ),
      deleteReports(userId),
      deleteCustomCertifications(userId),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('account DELETE error', error);
    return NextResponse.json(
      { error: 'failed to delete account data' },
      { status: 500 },
    );
  }
}
