'use client';
import { useRouter } from 'next/navigation';
import CalendarView from '@/src/components/CalendarView';

export default function Page(){ 
  const router = useRouter();

  return (
    <CalendarView />
  );
}