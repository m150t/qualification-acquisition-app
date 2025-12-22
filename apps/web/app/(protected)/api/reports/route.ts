// apps/web/app/api/reports/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { BatchWriteCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from '@/src/lib/dynamodb';

const REPORTS_TABLE = process.env.DDB_REPORTS_TABLE || 'StudyReports';

function getUserId(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return null;
  }
  return userId;
}

// ----------------------
// POST（日報保存）
// ----------------------
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

    const savedAt = new Date().toISOString();

    const item = {
      userId,
      date: `${date}#${savedAt}`,
      reportDate: date,
      studyTime,
      tasksCompleted,
      content: body.content ?? '',
      aiComment: body.aiComment ?? null,
      savedAt,
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
      new QueryCommand({
        TableName: REPORTS_TABLE,
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: {
          ':uid': userId,
        },
        ScanIndexForward: false,
      }),
    );

    const reports = (res.Items ?? []).map((item) => {
      const baseDate =
        typeof item.reportDate === 'string'
          ? item.reportDate
          : typeof item.date === 'string'
            ? item.date.split('#')[0] ?? item.date
            : '';

      return {
        ...item,
        date: baseDate,
      };
    });

    return NextResponse.json({ reports });
  } catch (e) {
    console.error('reports GET error', e);
    return NextResponse.json(
      { error: 'failed to load reports' },
      { status: 500 },
    );
  }
}

// ----------------------
// DELETE（日報一括削除・試験終了時）
// ----------------------
export async function DELETE(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'userId header is required' },
        { status: 401 },
      );
    }

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
    if (!items.length) {
      return NextResponse.json({ ok: true });
    }

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

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('reports DELETE error', e);
    return NextResponse.json(
      { error: 'failed to delete reports' },
      { status: 500 },
    );
  }
}
