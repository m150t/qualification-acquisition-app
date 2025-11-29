// app/api/feedback/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { content, studyTime, tasksCompleted } = body;

    console.log('feedback input', body, new Date().toISOString());

    if (!content) {
      return NextResponse.json(
        { error: 'content がありません' },
        { status: 400 },
      );
    }

    const completion = await client.chat.completions.create({
      // ← ここを 4o-mini に変える
      model: 'gpt-4o-mini',
      // まずは max_* 系は一切指定しない（変に効いている可能性を消す）
      messages: [
        {
          role: 'system',
          content:
            'あなたは資格学習を応援する優しいコーチです。' +
            '学習内容を褒めつつ、「次に何をやると良いか」を1〜2個具体的に提案してください。' +
            '丁寧だけどコンパクトに、200文字前後で日本語で答えてください。',
        },
        {
          role: 'user',
          content: `今日の学習内容: ${content}\n学習時間: ${
            studyTime ?? '不明'
          }時間\n完了タスク数: ${tasksCompleted ?? '不明'}件`,
        },
      ],
    });

    const msg = completion.choices[0]?.message;
    const text = (msg?.content ?? '').toString();

    console.log('feedback raw message', JSON.stringify(msg, null, 2));
    console.log('feedback comment', text);

    if (!text) {
      // 本当に空だったときだけ fallback
      return NextResponse.json({
        comment:
          'コメントを取得できませんでした（content が空でした）。',
      });
    }

    return NextResponse.json({ comment: text });
  } catch (e: any) {
    console.error('feedback api error', e);
    return NextResponse.json(
      {
        error: 'AIコメント生成に失敗しました',
        detail: e?.message ?? String(e),
      },
      { status: 500 },
    );
  }
}
