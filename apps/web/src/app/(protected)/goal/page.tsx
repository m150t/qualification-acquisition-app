'use client';
import { useRouter } from 'next/navigation';
import GoalSetting from '@/features/goal/GoalSetting';

export default function Page() {
  const router = useRouter();

  return (
    <GoalSetting />
  );
}

