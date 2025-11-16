'use client';
import { useRouter } from 'next/navigation';
import DailyReport from '@/src/components/DailyReport';

export default function Page() {
  const router = useRouter();

  return (
    <DailyReport
      onBack={() => {
        router.push('/');
      }}
    />
  );
}