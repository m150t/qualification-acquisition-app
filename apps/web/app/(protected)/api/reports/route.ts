import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/src/lib/dynamodb";
import { requireAuth } from "@/src/lib/authServer";
import { hash8, log } from "@/src/lib/logger";
import { deleteReportsForUser } from "@/src/lib/reportStore";

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
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
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

    log("info", "reports post success", {
      requestId,
      userIdHash: hash8(auth.userId),
      date,
      hasAiComment: Boolean(body.aiComment),
    });
    return NextResponse.json({ ok: true, requestId });
  } catch (e) {
    log("error", "reports POST error", { requestId, error: String(e) });
    return NextResponse.json({ error: "failed to save report", requestId }, { status: 500 });
  }
}

// ----------------------
// GET（日報一覧）
// ----------------------
export async function GET(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
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

    log("info", "reports get success", {
      requestId,
      userIdHash: hash8(auth.userId),
      reportCount: reports.length,
    });
    return NextResponse.json({ reports, requestId });
  } catch (e) {
    log("error", "reports GET error", { requestId, error: String(e) });
    return NextResponse.json({ error: "failed to load reports", requestId }, { status: 500 });
  }
}

// ----------------------
// DELETE（日報一括削除・試験終了時）
// ----------------------
export async function DELETE(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const result = await deleteReportsForUser(auth.userId, REPORTS_TABLE);
    if (result.deleted === 0 && result.unprocessed === 0) {
      log("info", "reports delete empty", { requestId, userIdHash: hash8(auth.userId) });
      return NextResponse.json({ ok: true, requestId });
    }
    if (result.unprocessed > 0) {
      log("warn", "reports delete partial", {
        requestId,
        userIdHash: hash8(auth.userId),
        deleted: result.deleted,
        unprocessed: result.unprocessed,
      });
    } else {
      log("info", "reports delete success", {
        requestId,
        userIdHash: hash8(auth.userId),
        deleted: result.deleted,
      });
    }
    return NextResponse.json({ ok: true, requestId });
  } catch (e) {
    log("error", "reports DELETE error", { requestId, error: String(e) });
    return NextResponse.json({ error: "failed to delete reports", requestId }, { status: 500 });
  }
}
// ----------------------
// PATCH（AIコメント更新）
// ----------------------
export async function PATCH(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
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

    log("info", "reports patch success", {
      requestId,
      userIdHash: hash8(auth.userId),
      date,
      aiCommentLength: String(aiComment).length,
    });
    return NextResponse.json({ ok: true, requestId });
  } catch (e) {
    log("error", "reports PATCH error", { requestId, error: String(e) });
    return NextResponse.json({ error: "failed to update report", requestId }, { status: 500 });
  }
}
