// apps/web/src/lib/goals.ts
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { ddbDocClient } from './dynamodb';

const TABLE_NAME = process.env.GOALS_TABLE_NAME || 'study_goals';

export type WeeklyPlan = {
  week: number;
  theme: string;
  topics: string[];
};

export type SaveGoalInput = {
  userId: string;
  certCode: string;
  certName: string;
  examDate: string;
  weeklyHours: number | null;
  weeksUntilExam: number | null;
  plan: WeeklyPlan[];
};

export async function saveGoal(input: SaveGoalInput) {
  const goalId = randomUUID();

  const item = {
    pk: `USER#${input.userId}`,
    sk: 'GOAL#current', // ひとまず「現在の目標」固定

    goalId,
    certCode: input.certCode,
    certName: input.certName,
    examDate: input.examDate,
    weeklyHours: input.weeklyHours,
    weeksUntilExam: input.weeksUntilExam,
    plan: input.plan,
    createdAt: new Date().toISOString(),
  };

  await ddbDocClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }),
  );

  return item;
}
