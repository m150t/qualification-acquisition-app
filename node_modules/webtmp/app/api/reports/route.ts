// apps/web/app/api/reports/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from '@/src/lib/dynamodb';

const REPORTS_TABLE = process.env.DDB_REPORTS_TABLE || 'StudyReports';
const DEMO_USER_ID = 'demo-user';

// ----------------------
// POST（日報保存）
// ----------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const date: string = body.date;
    if (!date) {
      return NextResponse.json({ error: 'date is required' }, { status: 400 });
    }

    const studyTime =
      body.studyTime === '' || body.studyTime == null
        ? null
        : Number(body.studyTime);

    const tasksCompleted =
      body.tasksCompleted === '' || body.tasksCompleted == null
        ? null
        : Number(body.tasksCompleted);

    const item = {
      userId: DEMO_USER_ID,
      date,
      studyTime,
      tasksCompleted,
      content: body.content ?? '',
      aiComment: body.aiComment ?? null,
      savedAt: new Date().toISOString(),
    };

    await ddb.send(
      new PutCommand({
        TableName: REPORTS_TABLE,
        Item: item,
      }),
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('reports POST error', e);
    return NextResponse.json(
      { error: 'failed to save report' },
      { status: 500 },
    );
  }
}

// ----------------------
// GET（日報一覧）
// ----------------------
export async function GET() {
  try {
    const res = await ddb.send(
      new QueryCommand({
        TableName: REPORTS_TABLE,
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: {
          ':uid': DEMO_USER_ID,
        },
        ScanIndexForward: false,
      }),
    );

    const reports = res.Items ?? [];

    return NextResponse.json({ reports });
  } catch (e) {
    console.error('reports GET error', e);
    return NextResponse.json(
      { error: 'failed to load reports' },
      { status: 500 },
    );
  }
}
