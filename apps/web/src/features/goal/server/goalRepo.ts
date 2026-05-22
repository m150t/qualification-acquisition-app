// ==================================================
// GOALS_TABLE へのCRUDだけ。
// ==================================================

import { DeleteCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/dynamodb";
import type { GoalPlanDay } from "./normalize";

const GOALS_TABLE = process.env.DDB_GOALS_TABLE || "StudyGoals";

export type GoalItem = {
  userId: string;
  certCode: string | null;
  certName: string | null;
  examDate: string | null;
  weeklyHours: number | null;
  weeksUntilExam: number | null;
  plan: GoalPlanDay[];
  createdAt?: string;
  updatedAt?: string;
};

export async function getGoalItem(userId: string) {
  const res = await ddb.send(
    new GetCommand({
      TableName: GOALS_TABLE,
      Key: { userId },
    }),
  );
  return (res.Item as GoalItem | undefined) ?? null;
}

/**
 * 目標のフル更新（createdAt保護）
 * - saveGoal で使う
 */
export async function upsertGoalItem(item: GoalItem) {
  const now = new Date().toISOString();

  const res = await ddb.send(
    new UpdateCommand({
      TableName: GOALS_TABLE,
      Key: { userId: item.userId },
      UpdateExpression: `
        SET
          certCode = :certCode,
          certName = :certName,
          examDate = :examDate,
          weeklyHours = :weeklyHours,
          weeksUntilExam = :weeksUntilExam,
          #plan = :plan,
          updatedAt = :now,
          createdAt = if_not_exists(createdAt, :now)
      `,
      ExpressionAttributeNames: {
        "#plan": "plan",
      },
      ExpressionAttributeValues: {
        ":certCode": item.certCode ?? null,
        ":certName": item.certName ?? null,
        ":examDate": item.examDate ?? null,
        ":weeklyHours": item.weeklyHours ?? null,
        ":weeksUntilExam": item.weeksUntilExam ?? null,
        ":plan": Array.isArray(item.plan) ? item.plan : [],
        ":now": now,
      },
      ReturnValues: "ALL_NEW",
    }),
  );

  return (res.Attributes as GoalItem | undefined) ?? null;
}

/**
 * plan だけ更新（他属性に触らない）
 * - postponePlanDay で使う
 */
export async function updateGoalPlanOnly(params: { userId: string; plan: GoalPlanDay[] }) {
  const now = new Date().toISOString();

  const res = await ddb.send(
    new UpdateCommand({
      TableName: GOALS_TABLE,
      Key: { userId: params.userId },
      UpdateExpression: `
        SET
          #plan = :plan,
          updatedAt = :now
      `,
      ExpressionAttributeNames: {
        "#plan": "plan",
      },
      ExpressionAttributeValues: {
        ":plan": Array.isArray(params.plan) ? params.plan : [],
        ":now": now,
      },
      ReturnValues: "ALL_NEW",
    }),
  );

  return (res.Attributes as GoalItem | undefined) ?? null;
}

export async function deleteGoalItem(userId: string) {
  await ddb.send(
    new DeleteCommand({
      TableName: GOALS_TABLE,
      Key: { userId },
    }),
  );
}
