// ==================================================
// Goals(plan) から当日分だけ引く（Feedback専用の読み取りRepo）
// ==================================================
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/src/lib/dynamodb";
import { hash8, log } from "@/src/lib/logger";
import { PlanDay } from "./types";

const GOALS_TABLE = process.env.DDB_GOALS_TABLE || "StudyGoals";

export async function findPlanDay(params: {
  userId: string;
  date: string;
  requestId: string;
}): Promise<PlanDay | null> {
  const { userId, date, requestId } = params;

  const res = await ddb.send(
    new GetCommand({
      TableName: GOALS_TABLE,
      Key: { userId },
      ProjectionExpression: "#p",
      ExpressionAttributeNames: { "#p": "plan" },
    }),
  );

  const plan = (res.Item as any)?.plan;
  if (!Array.isArray(plan)) return null;

  const day = plan.find((p: any) => p?.date === date);
  if (!day) return null;

  const rawTasks = Array.isArray(day.tasks)
    ? day.tasks
    : Array.isArray(day.topics)
      ? day.topics
      : [];

  const tasks = rawTasks.filter((t: any) => typeof t === "string");
  const theme = typeof day.theme === "string" ? day.theme : undefined;

  log("info", "feedback plan found", {
    requestId,
    userIdHash: hash8(userId),
    date,
    plannedTasks: tasks.length,
    hasTheme: Boolean(theme),
  });

  return { date, theme, tasks };
}
