import { NextRequest, NextResponse } from "next/server";
import { BatchWriteCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/src/lib/dynamodb";
import { requireAuth } from "@/src/lib/authServer";

const REPORTS_TABLE = process.env.DDB_REPORTS_TABLE || "StudyReports";
const MAX_CONTENT_LENGTH = 4000;
const MAX_DATE_LENGTH = 20;

function safeNumber(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n === "number" && Number.isFinite(n)) return n;
  return null;
}

// ----------------------
// POST（日報保存）
// ----------------------
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const date = String(body.date ?? "").trim();
    if (!date || date.length > MAX_DATE_LENGTH) {
      return NextResponse.json({ error: "date is required" }, { status: 400 });
    }

    const studyTime = safeNumber(body.studyTime);
    const tasksCompleted = safeNumber(body.tasksCompleted);

    if (studyTime != null && studyTime < 0) {
      return NextResponse.json({ error: "studyTime must be >= 0" }, { status: 400 });
    }
    if (tasksCompleted != null && tasksCompleted < 0) {
      return NextResponse.json({ error: "tasksCompleted must be >= 0" }, { status: 400 });
    }

    const content = String(body.content ?? "").slice(0, MAX_CONTENT_LENGTH);

    const savedAt = new Date().toISOString();

    const item = {
      userId: auth.userId,
      date: `${date}#${savedAt}`,
      reportDate: date,
      studyTime,
      tasksCompleted,
      content,
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
    console.error("reports POST error", e);
    return NextResponse.json({ error: "failed to save report" }, { status: 500 });
  }
}

// ----------------------
// GET（日報一覧）
// ----------------------
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const res = await ddb.send(
      new QueryCommand({
        TableName: REPORTS_TABLE,
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: {
          ":uid": auth.userId,
        },
        ScanIndexForward: false,
      }),
    );

    const reports = (res.Items ?? []).map((item) => {
      const baseDate =
        typeof item.reportDate === "string"
          ? item.reportDate
          : typeof item.date === "string"
            ? item.date.split("#")[0] ?? item.date
            : "";

      return {
        ...item,
        date: baseDate,
      };
    });

    return NextResponse.json({ reports });
  } catch (e) {
    console.error("reports GET error", e);
    return NextResponse.json({ error: "failed to load reports" }, { status: 500 });
  }
}

// ----------------------
// DELETE（日報一括削除・試験終了時）
// ----------------------
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const res = await ddb.send(
      new QueryCommand({
        TableName: REPORTS_TABLE,
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: { ":uid": auth.userId },
        ProjectionExpression: "userId, #d",
        ExpressionAttributeNames: { "#d": "date" },
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
    console.error("reports DELETE error", e);
    return NextResponse.json({ error: "failed to delete reports" }, { status: 500 });
  }
}
// ----------------------
// PATCH（AIコメント更新）
// ----------------------
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { date, aiComment } = body;

    if (!date || !aiComment) {
      return NextResponse.json({ error: "date and aiComment are required" }, { status: 400 });
    }

    if (String(aiComment).length > MAX_CONTENT_LENGTH) {
      return NextResponse.json({ error: "aiComment is too long" }, { status: 400 });
    }

    const res = await ddb.send(
      new QueryCommand({
        TableName: REPORTS_TABLE,
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: { ":uid": auth.userId },
        ScanIndexForward: false,
      }),
    );

    const items = res.Items ?? [];
    const target = items.find((item) => {
      const baseDate =
        typeof item.reportDate === "string"
          ? item.reportDate
          : typeof item.date === "string"
            ? item.date.split("#")[0] ?? item.date
            : "";
      return baseDate === date;
    });

    if (!target) {
      return NextResponse.json({ error: "report not found" }, { status: 404 });
    }

    await ddb.send(
      new UpdateCommand({
        TableName: REPORTS_TABLE,
        Key: { userId: target.userId, date: target.date },
        UpdateExpression: "SET aiComment = :c",
        ExpressionAttributeValues: {
          ":c": aiComment,
        },
      }),
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("reports PATCH error", e);
    return NextResponse.json({ error: "failed to update report" }, { status: 500 });
  }
}
