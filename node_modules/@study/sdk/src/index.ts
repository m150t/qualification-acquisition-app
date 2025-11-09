import type { PlanItem, DailyLog } from '@study/shared';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000/api';
export async function getItems(from: string, to: string): Promise<PlanItem[]> {
  const res = await fetch(\\/items?from=\&to=\\, { cache: 'no-store' });
  if (!res.ok) throw new Error('items fetch failed');
  return res.json();
}
export async function postGoal(input: { examDate: string; freq: number; themes: string[] }) {
  const res = await fetch(\\/goals\, {
    method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(input)
  });
  if (!res.ok) throw new Error('postGoal failed');
  return res.json();
}
export async function postDaily(log: Omit<DailyLog,'uid'>) {
  const res = await fetch(\\/daily\, {
    method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(log)
  });
  if (!res.ok) throw new Error('postDaily failed');
  return res.json();
}