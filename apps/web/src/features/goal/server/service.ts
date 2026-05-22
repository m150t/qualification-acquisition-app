// ==================================================
// Goalのユースケース
// ==================================================

import { hash8, log } from "@/lib/logger";
import { deleteAllReportsForUser } from "./reportRepo";
import { deleteGoalItem, getGoalItem, upsertGoalItem, updateGoalPlanOnly } from "./goalRepo";
import { putCustomCertification } from "./customCertRepo";
import {
  GoalPlanDay,
  normalizePlanFromToday,
  normalizeTaskList,
  sortPlanByDate,
  toDateOnlyString,
} from "./normalize";

const MAX_CERT_NAME_LENGTH = 200;
const MAX_THEME_LENGTH = 200;
const MAX_DATE_LENGTH = 20;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type ServiceError = { status: number; error: string };

// ----------------------
// usecases
// ----------------------

type GoalRequestBody = {
  certCode?: unknown;
  certName?: unknown;
  examDate?: unknown;
  weeklyHours?: unknown;
  weeksUntilExam?: unknown;
  plan?: unknown;
  resetReports?: unknown;
};

function asGoalRequestBody(body: unknown): GoalRequestBody {
  return body && typeof body === "object" ? body : {};
}

export async function saveGoal(params: { requestId: string; userId: string; body: unknown }) {
  const { requestId, userId, body } = params;
  const input = asGoalRequestBody(body);

  const plan = normalizePlanFromToday(input.plan);
  const resetReports = Boolean(input.resetReports);

  const goal = {
    userId,
    certCode: typeof input.certCode === "string" ? input.certCode : null,
    certName:
      typeof input.certName === "string" ? input.certName.slice(0, MAX_CERT_NAME_LENGTH) : null,
    examDate: typeof input.examDate === "string" ? input.examDate : null,
    weeklyHours: typeof input.weeklyHours === "number" ? input.weeklyHours : null,
    weeksUntilExam: typeof input.weeksUntilExam === "number" ? input.weeksUntilExam : null,
    plan,
  };

  await upsertGoalItem(goal);

  if (resetReports) {
    await deleteAllReportsForUser({ userId, requestId });
  }

  if (input.certCode === "other" && typeof input.certName === "string" && input.certName) {
    try {
      await putCustomCertification({ userId, certName: input.certName });
    } catch (error) {
      log("error", "failed to save custom certification", {
        requestId,
        userIdHash: hash8(userId),
        error: String(error),
      });
    }
  }

  log("info", "goal saved", { requestId, userIdHash: hash8(userId) });
  return { ok: true, requestId };
}

export async function getGoal(params: { requestId: string; userId: string }) {
  const { requestId, userId } = params;

  const item = await getGoalItem(userId);
  if (!item) {
    log("info", "goals get empty", { requestId, userIdHash: hash8(userId) });
    return { goal: null, plan: [], requestId };
  }

  const { plan, ...goal } = item;

  log("info", "goals get success", {
    requestId,
    userIdHash: hash8(userId),
    planDays: Array.isArray(plan) ? plan.length : 0,
  });

  return { goal, plan: Array.isArray(plan) ? plan : [], requestId };
}

export async function postponePlanDay(params: { requestId: string; userId: string; date: string }) {
  const { requestId, userId, date } = params;

  const item = await getGoalItem(userId);
  if (!item) {
    log("info", "goals patch empty", { requestId, userIdHash: hash8(userId) });
    return { error: "goal not found", status: 404 as const };
  }

  const originalPlan = Array.isArray(item.plan) ? item.plan : [];
  const plan: GoalPlanDay[] = originalPlan.map((d) => ({ ...d }));

  const targetIndex = plan.findIndex((day) => day?.date === date);
  if (targetIndex === -1) {
    return { error: "plan date not found", status: 404 as const };
  }

  const targetDay = plan[targetIndex] ?? {};
  const targetTasks = normalizeTaskList(targetDay.tasks);

  if (!targetTasks.length) {
    return { ok: true, plan: originalPlan, requestId };
  }

  const targetDate = new Date(`${date}T00:00:00`);
  if (Number.isNaN(targetDate.getTime())) {
    return { error: "invalid date", status: 400 as const };
  }

  const nextDate = toDateOnlyString(new Date(targetDate.getTime() + MS_PER_DAY)).slice(0, MAX_DATE_LENGTH);
  const nextIndex = plan.findIndex((day) => day?.date === nextDate);

  if (nextIndex === -1) {
    plan.push({
      date: nextDate,
      theme: typeof targetDay.theme === "string" ? targetDay.theme.trim().slice(0, MAX_THEME_LENGTH) : "",
      tasks: targetTasks,
    });
  } else {
    const nextDay = plan[nextIndex] ?? {};
    const nextTasks = normalizeTaskList(nextDay.tasks);
    plan[nextIndex] = { ...nextDay, tasks: [...nextTasks, ...targetTasks] };
  }

  plan[targetIndex] = { ...targetDay, tasks: [] };

  const sortedPlan = sortPlanByDate(plan);

  // ★ plan だけ更新（他の goal 属性を壊さない）
  await updateGoalPlanOnly({ userId, plan: sortedPlan });

  log("info", "goals patch postpone success", {
    requestId,
    userIdHash: hash8(userId),
    date,
    shiftedTasks: targetTasks.length,
  });

  return { ok: true, plan: sortedPlan, requestId };
}

export async function deleteGoal(params: { requestId: string; userId: string }) {
  const { requestId, userId } = params;

  await deleteGoalItem(userId);
  await deleteAllReportsForUser({ userId, requestId });

  log("info", "goals delete success", { requestId, userIdHash: hash8(userId) });
  return { ok: true, requestId };
}
