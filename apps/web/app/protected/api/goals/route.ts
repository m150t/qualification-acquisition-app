// apps/web/app/api/goals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from '@/src/lib/dynamodb';

const GOALS_TABLE = process.env.DDB_GOALS_TABLE || 'StudyGoals';
const DEMO_USER_ID = 'demo-user'; // 認証入るまでの仮

// POST: 目標＋日付ベースの計画を保存
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const item = {
      userId: DEMO_USER_ID,
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
export async function GET() {
  try {
    const res = await ddb.send(
      new GetCommand({
        TableName: GOALS_TABLE,
        Key: { userId: DEMO_USER_ID },
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
