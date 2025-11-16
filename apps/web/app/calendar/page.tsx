'use client';
import { useRouter } from 'next/navigation';
import CalendarView from '@/src/components/CalendarView';

export default function Page(){ 
  const router = useRouter();

  return (
    <CalendarView
      onBack={() => {
        // ホームに戻る
        router.push('/');
        // 「履歴で戻る」がいいなら router.back() でもOK
      }}
    />
  );
}