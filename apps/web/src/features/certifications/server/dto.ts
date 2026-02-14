export type CertificationDto = {
  code: string;
  name: string;
  provider?: string;
  defaultWeeklyHours?: number;
  defaultWeeks?: number;
  examGuide?: unknown;
};
