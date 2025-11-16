// apps/web/src/store/useStudy.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import type { Goal, PlanItem, DailyLog } from '@study/shared';

type S = {
  goal: Goal;
  plan: PlanItem[];
  logs: DailyLog[];
  setGoal: (g: Goal) => void;
  setPlan: (p: PlanItem[]) => void;
  toggleDone: (id: string) => void;
  addLog: (l: DailyLog) => void;
};
export const useStudy = create<S>()(persist((set,get)=>({
  goal: undefined,
  plan: [],
  logs: [],
  setGoal: (goal)=> set({ goal }),
  setPlan: (plan)=> set({ plan }),
  toggleDone: (id)=> set({ plan: get().plan.map(p => p.id===id ? {...p, completed: !p.completed} : p) }),
  addLog: (log)=> set({ logs: [...get().logs.filter(l=>l.date!==log.date), log] })
}), { name: 'studycoach-local' }));

export const todayISO = () => new Date().toISOString().slice(0,10);
export const selectPlanByDate = (iso:string, s: Pick<S,'plan'>) =>
  s.plan.filter(p => p.date === iso);
