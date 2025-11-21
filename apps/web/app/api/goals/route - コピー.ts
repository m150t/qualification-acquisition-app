import { NextResponse } from 'next/server';
import { saveGoal, WeeklyPlan } from '@/src/lib/goals';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      certCode,
      certName,
      examDate,
      weeklyHours,
      weeksUntilExam,
      plan,
    } = body as {
      certCode: string;
      certName: string;
      examDate: string;
      weeklyHours: number | null;
      weeksUntilExam: number | null;
      plan: WeeklyPlan[];
    };

    // TODO: 認証入れるまでは仮ユーザー
    const userId = 'demo-user';

    if (!examDate || !certCode) {
      return NextResponse.json(
        { error: 'certCode と examDate は必須です' },
        { status: 400 },
      );
    }

    const saved = await saveGoal({
      userId,
      certCode,
      certName,
      examDate,
      weeklyHours: weeklyHours ?? null,
      weeksUntilExam: weeksUntilExam ?? null,
      plan: plan ?? [],
    });

    return NextResponse.json({ ok: true, goal: saved });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: 'failed to save goal' },
      { status: 500 },
    );
  }
}