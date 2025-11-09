export type UID = string;
export type PlanStatus = 'planned' | 'done' | 'skipped';
export type PlanItem = { uid: UID; date: string; theme: string; status: PlanStatus; };
export type DailyLog = { uid: UID; date: string; theme: string; did: boolean; note?: string; aiFeedback?: string; };