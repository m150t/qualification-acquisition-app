// apps/web/app/api/goals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { DeleteCommand, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { ddb } from '@/src/lib/dynamodb';

const GOALS_TABLE = process.env.DDB_GOALS_TABLE || 'StudyGoals';
const CUSTOM_CERTIFICATIONS_TABLE =
  process.env.DDB_CUSTOM_CERTIFICATIONS_TABLE || 'CustomCertifications';

function getUserId(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return null;
  }
  return userId;
}

// POST: 目標＋日付ベースの計画を保存
export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'userId header is required' },
        { status: 401 },
      );
    }

    const body = await req.json();

    const item = {
      userId,
      certCode: body.certCode ?? null,
      certName: body.certName ?? null,
      examDate: body.examDate ?? null,
      weeklyHours: body.weeklyHours ?? null,
      weeksUntilExam: body.weeksUntilExam ?? null,
      plan: body.plan ?? [],
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(), // Put 上書きでも一旦同じでOK
    };

    await ddb.send(
      new PutCommand({
        TableName: GOALS_TABLE,
        Item: item,
      }),
    );

    if (body.certCode === 'other' && body.certName) {
      try {
        await ddb.send(
          new PutCommand({
            TableName: CUSTOM_CERTIFICATIONS_TABLE,
            Item: {
              id: randomUUID(),
              userId,
              certName: body.certName,
              status: 'pending',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          }),
        );
      } catch (error) {
        console.error('failed to save custom certification', error);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('goals POST error', e);
    return NextResponse.json(
      { error: 'failed to save goal' },
      { status: 500 },
    );
  }
}

// GET: 目標＋計画を取得
export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'userId header is required' },
        { status: 401 },
      );
    }

    const res = await ddb.send(
      new GetCommand({
        TableName: GOALS_TABLE,
        Key: { userId },
      }),
    );

    if (!res.Item) {
      return NextResponse.json({ goal: null, plan: [] });
    }

    const { plan, ...goal } = res.Item;
    return NextResponse.json({
      goal,
      plan: Array.isArray(plan) ? plan : [],
    });
  } catch (e) {
    console.error('goals GET error', e);
    return NextResponse.json(
      { error: 'failed to load goal' },
      { status: 500 },
    );
  }
}

// DELETE: 目標と計画を削除（試験終了後のリセット用途）
export async function DELETE(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'userId header is required' },
        { status: 401 },
      );
    }

    await ddb.send(
      new DeleteCommand({
        TableName: GOALS_TABLE,
        Key: { userId },
      }),
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('goals DELETE error', e);
    return NextResponse.json(
      { error: 'failed to delete goal' },
      { status: 500 },
    );
  }
}
