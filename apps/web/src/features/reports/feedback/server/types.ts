export type PlanDay = {
  date: string;
  theme?: string;
  tasks: string[];
};

export type FeedbackRequest = {
  date: string;
  content: string;
  studyTime?: number | string | null;
  tasksCompleted?: number | string | null;
};
