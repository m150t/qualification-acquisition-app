// ==================================================
// 変換/正規化/日付ユーティリティをまとめる。
// ==================================================

const MAX_PLAN_DAYS = 366;
const MAX_TASKS_PER_DAY = 20;
const MAX_TASK_LENGTH = 200;
const MAX_THEME_LENGTH = 200;
const MAX_DATE_LENGTH = 20;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type GoalPlanDay = {
  date: string;
  theme?: string;
  tasks?: string[];
};

type PlanInputDay = {
  theme?: unknown;
  tasks?: unknown;
  topics?: unknown;
};

function isPlanInputDay(value: unknown): value is PlanInputDay {
  return Boolean(value && typeof value === "object");
}

export function toDateOnlyString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * “今日から連番で日付を付ける” 正規化
 * ※あなたの現仕様を維持するならこう。
 * ※将来は「入力されたdateを尊重」へ寄せるのが安全。
 */
export function normalizePlanFromToday(plan: unknown) {
  if (!Array.isArray(plan)) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return plan.slice(0, MAX_PLAN_DAYS).map((day, index) => {
    const date = toDateOnlyString(new Date(today.getTime() + index * MS_PER_DAY)).slice(0, MAX_DATE_LENGTH);
    const inputDay = isPlanInputDay(day) ? day : {};

    const theme =
      typeof inputDay.theme === "string"
        ? inputDay.theme.trim().slice(0, MAX_THEME_LENGTH)
        : undefined;

    // 過去互換（topicsでも受ける）
    const rawTasks = Array.isArray(inputDay.tasks)
      ? inputDay.tasks
      : Array.isArray(inputDay.topics)
        ? inputDay.topics
        : [];

    const tasks = rawTasks
      .filter((t: unknown) => typeof t === "string")
      .slice(0, MAX_TASKS_PER_DAY)
      .map((t: string) => t.trim().slice(0, MAX_TASK_LENGTH))
      .filter((t: string) => t.length > 0);

    return { date, theme, tasks };
  });
}

export function normalizeTaskList(tasks: unknown) {
  if (!Array.isArray(tasks)) return [];
  return tasks
    .filter((t: unknown) => typeof t === "string")
    .map((t: string) => t.trim().slice(0, MAX_TASK_LENGTH))
    .filter((t: string) => t.length > 0);
}

export function sortPlanByDate(plan: GoalPlanDay[]) {
  return [...plan].sort((a, b) => String(a?.date ?? "").localeCompare(String(b?.date ?? "")));
}

/**
 * Planの正規化（案A）
 *
 * 方針:
 * - 入力の date を尊重する
 * - date が無い/不正な場合のみ補完
 * - 重複 date は tasks をマージ
 * - date 昇順で返す
 */

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

type RawPlanDay = {
  date?: unknown;
  theme?: unknown;
  tasks?: unknown;
  topics?: unknown;
};

type PlanDay = {
  date: string;
  theme?: string;
  tasks: string[];
};

function formatDateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function normalizeDateString(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (DATE_ONLY_REGEX.test(trimmed)) return trimmed;

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return "";

  parsed.setHours(0, 0, 0, 0);
  return formatDateOnly(parsed);
}

function normalizeTasks(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.trim().slice(0, MAX_TASK_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_TASKS_PER_DAY);
}

function normalizeTheme(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const t = raw.trim().slice(0, MAX_THEME_LENGTH);
  return t || undefined;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return formatDateOnly(new Date(d.getTime() + days * MS_PER_DAY));
}

export function normalizePlanRespectDate(plan: unknown): PlanDay[] {
  if (!Array.isArray(plan)) return [];

  // ---------- step1: date を尊重して一旦展開 ----------
  const raw: PlanDay[] = plan.slice(0, MAX_PLAN_DAYS).map((day: RawPlanDay) => ({
    date:
      typeof day?.date === "string"
        ? normalizeDateString(day.date)
        : "",
    theme: normalizeTheme(day?.theme),
    tasks: normalizeTasks(day?.tasks ?? day?.topics),
  }));

  // ---------- step2: dateが空のものを補完 ----------
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let lastDate = "";
  const filled = raw.map((d) => {
    if (d.date) {
      lastDate = d.date;
      return d;
    }

    // date が無い場合のみ補完
    const base = lastDate || formatDateOnly(today);
    const nextDate = lastDate ? addDays(base, 1) : base;
    lastDate = nextDate;

    return { ...d, date: nextDate };
  });

  // ---------- step3: date重複をマージ ----------
  const byDate = new Map<string, PlanDay>();

  for (const d of filled) {
    if (!d.date) continue;

    const existing = byDate.get(d.date);
    if (!existing) {
      byDate.set(d.date, { ...d });
      continue;
    }

    byDate.set(d.date, {
      date: d.date,
      theme: existing.theme ?? d.theme,
      tasks: [...existing.tasks, ...d.tasks].slice(0, MAX_TASKS_PER_DAY),
    });
  }

  // ---------- step4: date昇順 ----------
  return Array.from(byDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}
