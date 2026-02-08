'use client';
import { useRouter } from 'next/navigation';
import CalendarView from '@/features/calender/CalendarView';

export default function Page(){ 
  const router = useRouter();

  return (
    <CalendarView />
  );
}