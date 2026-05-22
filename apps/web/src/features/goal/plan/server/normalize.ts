import { PlanDay } from "./types";

const MAX_PLAN_DAYS = 366;
const MAX_TASKS_PER_DAY = 20;
const MAX_TASK_LENGTH = 200;
const MAX_THEME_LENGTH = 200;

export function sanitizePlan(input: unknown): PlanDay[] {
  if (!Array.isArray(input)) return [];

  return input.slice(0, MAX_PLAN_DAYS).map((day) => {
    const item =
      day && typeof day === "object"
        ? (day as { date?: unknown; theme?: unknown; tasks?: unknown })
        : {};
    const date = typeof item.date === "string" ? item.date.trim() : "";
    const theme = typeof item.theme === "string" ? item.theme.trim().slice(0, MAX_THEME_LENGTH) : undefined;

    const rawTasks = Array.isArray(item.tasks) ? item.tasks : [];
    const tasks = rawTasks
      .filter((t: unknown) => typeof t === "string")
      .slice(0, MAX_TASKS_PER_DAY)
      .map((t: string) => t.trim().slice(0, MAX_TASK_LENGTH))
      .filter((t: string) => t.length > 0);

    return { date, theme, tasks };
  });
}
