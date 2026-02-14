import { PlanDay } from "./types";

const MAX_PLAN_DAYS = 366;
const MAX_TASKS_PER_DAY = 20;
const MAX_TASK_LENGTH = 200;
const MAX_THEME_LENGTH = 200;

export function sanitizePlan(input: unknown): PlanDay[] {
  if (!Array.isArray(input)) return [];

  return input.slice(0, MAX_PLAN_DAYS).map((day: any) => {
    const date = typeof day?.date === "string" ? String(day.date).trim() : "";
    const theme = typeof day?.theme === "string" ? day.theme.trim().slice(0, MAX_THEME_LENGTH) : undefined;

    const rawTasks = Array.isArray(day?.tasks) ? day.tasks : [];
    const tasks = rawTasks
      .filter((t: unknown) => typeof t === "string")
      .slice(0, MAX_TASKS_PER_DAY)
      .map((t: string) => t.trim().slice(0, MAX_TASK_LENGTH))
      .filter((t: string) => t.length > 0);

    return { date, theme, tasks };
  });
}