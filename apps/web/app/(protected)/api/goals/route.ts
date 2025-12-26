import { NextRequest, NextResponse } from "next/server";
import {
  BatchWriteCommand,
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { ddb } from "@/src/lib/dynamodb";
import { requireAuth } from "@/src/lib/authServer";
import { hash8, log } from "@/src/lib/logger";

const GOALS_TABLE = process.env.DDB_GOALS_TABLE || "StudyGoals";
const REPORTS_TABLE = process.env.DDB_REPORTS_TABLE || "StudyReports";
const CUSTOM_CERTIFICATIONS_TABLE =
  process.env.DDB_CUSTOM_CERTIFICATIONS_TABLE || "CustomCertifications";

const MAX_CERT_NAME_LENGTH = 200;
const MAX_PLAN_DAYS = 366;
const MAX_TASKS_PER_DAY = 20;
const MAX_TASK_LENGTH = 200;
const MAX_THEME_LENGTH = 200;
const MAX_DATE_LENGTH = 20;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toDateOnlyString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizePlan(plan: unknown) {
  if (!Array.isArray(plan)) return [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return plan.slice(0, MAX_PLAN_DAYS).map((day, index) => {
    const date = toDateOnlyString(new Date(today.getTime() + index * MS_PER_DAY)).slice(
      0,
      MAX_DATE_LENGTH,
    );
    const theme =
      typeof day?.theme === "string"
        ? day.theme.trim().slice(0, MAX_THEME_LENGTH)
        : undefined;
    const rawTasks = Array.isArray(day?.tasks) ? day.tasks : Array.isArray(day?.topics) ? day.topics : [];
    const tasks = rawTasks
      .filter((task: unknown) => typeof task === "string")
      .slice(0, MAX_TASKS_PER_DAY)
      .map((task: string) => task.trim().slice(0, MAX_TASK_LENGTH))
      .filter((task: string) => task.length > 0);
    return { date, theme, tasks };
  });
}

async function deleteUserReports(userId: string, requestId: string) {
  const items: Array<{ userId: string; date: string }> = [];
  let lastKey: Record<string, any> | undefined;

  do {
    const res = await ddb.send(
      new QueryCommand({
        TableName: REPORTS_TABLE,
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: { ":uid": userId },
        ProjectionExpression: "userId, #d",
        ExpressionAttributeNames: { "#d": "date" },
        ExclusiveStartKey: lastKey,
      }),
    );
    if (res.Items) {
      items.push(...(res.Items as Array<{ userId: string; date: string }>));
    }
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);

  if (!items.length) {
    log("info", "reports delete empty", { requestId, userIdHash: hash8(userId) });
    return 0;
  }

  const batches: typeof items[] = [];
  for (let i = 0; i < items.length; i += 25) {
    batches.push(items.slice(i, i + 25));
  }

  for (const batch of batches) {
    let unprocessed = batch.map((it) => ({
      DeleteRequest: { Key: { userId: it.userId, date: it.date } },
    }));
    let attempts = 0;
    while (unprocessed.length > 0 && attempts < 5) {
      const res = await ddb.send(
        new BatchWriteCommand({
          RequestItems: {
            [REPORTS_TABLE]: unprocessed,
          },
        }),
      );
      unprocessed = res.UnprocessedItems?.[REPORTS_TABLE] ?? [];
      attempts += 1;
    }
  }

  log("info", "reports delete success", {
    requestId,
    userIdHash: hash8(userId),
    deleted: items.length,
  });
  return items.length;
}

// POST: 目標＋日付ベースの計画を保存
export async function POST(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? randomUUID();
  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const plan = normalizePlan(body.plan);
    const resetReports = Boolean(body.resetReports);

    const item = {
      userId: auth.userId,
      certCode: body.certCode ?? null,
      certName:
        typeof body.certName === "string" ? body.certName.slice(0, MAX_CERT_NAME_LENGTH) : null,
      examDate: body.examDate ?? null,
      weeklyHours: body.weeklyHours ?? null,
      weeksUntilExam: body.weeksUntilExam ?? null,
      plan,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(), // Put 上書きでも一旦同じでOK
    };

    await ddb.send(
      new PutCommand({
        TableName: GOALS_TABLE,
        Item: item,
      }),
    );

    if (resetReports) {
      await deleteUserReports(auth.userId, requestId);
    }

    if (body.certCode === "other" && body.certName) {
      try {
        await ddb.send(
          new PutCommand({
            TableName: CUSTOM_CERTIFICATIONS_TABLE,
            Item: {
              id: randomUUID(),
              userId: auth.userId,
              certName: body.certName,
              status: "pending",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          }),
        );
      } catch (error) {
        log("error", "failed to save custom certification", {
          requestId,
          userIdHash: hash8(auth.userId),
          error: String(error),
        });
      }
    }

    log("info", "goals post success", { requestId, userIdHash: hash8(auth.userId) });
    return NextResponse.json({ ok: true, requestId });
  } catch (e) {
    log("error", "goals POST error", { requestId, error: String(e) });
    return NextResponse.json({ error: "failed to save goal", requestId }, { status: 500 });
  }
}

// GET: 目標＋計画を取得
export async function GET(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? randomUUID();
  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const res = await ddb.send(
      new GetCommand({
        TableName: GOALS_TABLE,
        Key: { userId: auth.userId },
      }),
    );

    if (!res.Item) {
      log("info", "goals get empty", { requestId, userIdHash: hash8(auth.userId) });
      return NextResponse.json({ goal: null, plan: [], requestId });
    }

    const { plan, ...goal } = res.Item;
    log("info", "goals get success", {
      requestId,
      userIdHash: hash8(auth.userId),
      planDays: Array.isArray(plan) ? plan.length : 0,
    });
    return NextResponse.json({
      goal,
      plan: Array.isArray(plan) ? plan : [],
      requestId,
    });
  } catch (e) {
    log("error", "goals GET error", { requestId, error: String(e) });
    return NextResponse.json({ error: "failed to load goal", requestId }, { status: 500 });
  }
}

// DELETE: 目標と計画を削除（試験終了後のリセット用途）
export async function DELETE(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? randomUUID();
  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    await ddb.send(
      new DeleteCommand({
        TableName: GOALS_TABLE,
        Key: { userId: auth.userId },
      }),
    );

    await deleteUserReports(auth.userId, requestId);

    log("info", "goals delete success", { requestId, userIdHash: hash8(auth.userId) });
    return NextResponse.json({ ok: true, requestId });
  } catch (e) {
    log("error", "goals DELETE error", { requestId, error: String(e) });
    return NextResponse.json({ error: "failed to delete goal", requestId }, { status: 500 });
  }
}
