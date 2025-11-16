export type PlanItem = {
  id: string;
  date: string;        // YYYY-MM-DD
  domain: string;
  topic: string;
  planned: boolean;
  completed: boolean;
  hours?: number;
};
export type DailyLog = { date: string; note?: string; aiFeedback?: string };
export type Goal = { cert: 'aws-saa'; examDate: string };