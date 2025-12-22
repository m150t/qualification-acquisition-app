// apps/web/app/api/plan/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type GeneratePlanRequest = {
  goal: {
    certName: string;
    examDate: string;      // YYYY-MM-DD
    weeklyHours: number;   // 目標学習時間（時間）
  };
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GeneratePlanRequest;
    const { goal } = body;

    if (!goal?.certName || !goal?.examDate) {
      return NextResponse.json(
        { error: 'goal.certName と goal.examDate は必須です' },
        { status: 400 },
      );
    }

    const prompt = `
資格名: ${goal.certName}
試験日: ${goal.examDate}
目標の週あたり学習時間: ${goal.weeklyHours} 時間

上記をもとに、試験日までの学習計画を立ててください。
レスポンスは必ず JSON 配列のみで返してください。各要素は以下の形式：
{
  "date": "YYYY-MM-DD",
  "theme": "その日の学習テーマ",
  "tasks": ["具体的なタスク1", "具体的なタスク2"]
}
`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content:
            'あなたは資格学習のコーチです。ユーザーの試験日から逆算して、現実的な日次学習計画を JSON で返してください。',
        },
        { role: 'user', content: prompt },
      ],
    });

    const msg = completion.choices[0]?.message;
    const text = (msg?.content ?? '').toString().trim();

    console.log('plan raw message', msg);

    let plan: Array<Record<string, unknown>> = [];

    try {
      if (text) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          plan = parsed as Array<Record<string, unknown>>;
        }
      }
    } catch (e) {
      console.error('failed to parse plan JSON', e, text);
      // パース失敗時は空配列で返す
      plan = [];
    }

    return NextResponse.json({ plan });
  } catch (e: unknown) {
    console.error('plan api error', e);
    return NextResponse.json(
      {
        error: '学習計画の生成に失敗しました',
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 500 },
    );
  }
}
