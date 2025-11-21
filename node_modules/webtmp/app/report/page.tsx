// apps/web/app/daily/page.tsx
'use client';

import { DailyReport } from '@/src/components/DailyReport';

export default function DailyPage() {
  return (
    <DailyReport onBack={() => history.back()} />
  );
}
