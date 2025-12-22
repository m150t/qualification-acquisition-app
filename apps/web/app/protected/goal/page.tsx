'use client';
import { useRouter } from 'next/navigation';
import GoalSetting from '@/src/components/GoalSetting';

export default function Page() {
  const router = useRouter();

  return (
    <GoalSetting />
  );
}

