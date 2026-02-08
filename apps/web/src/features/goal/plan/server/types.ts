export type GeneratePlanRequest = {
  goal: {
    certCode?: string;
    certName: string;
    examDate: string; // YYYY-MM-DD を想定
    weeklyHours: number | null;
  };
};

export type PlanDay = {
  date: string;
  theme?: string;
  tasks?: string[];
};

export type ExamGuide =
  | string
  | {
      summary?: string;
      topics?: string[];
      sourceUrl?: string;
      notes?: string;
    };
