import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { content, studyTime, tasksCompleted } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'content がありません' },
        { status: 400 }
      );
    }

    const prompt = `
以下は学習日報です。内容を踏まえて、ポジティブかつ現実的なアドバイスをください。

【学習時間】${studyTime ?? '不明'} 時間
【完了タスク】${tasksCompleted ?? '不明'} 件
【内容】
${content}
`;

    const completion = await client.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [
        {
          role: 'system',
          content:
            'あなたは資格勉強をサポートするチューターです。前向きな励ましと短い改善提案をしてください。',
        },
        { role: 'user', content: prompt },
      ],
      max_completion_tokens: 200, // ←重要
    });

    const comment =
      completion.choices?.[0]?.message?.content ??
      'コメント生成に失敗しました';

    return NextResponse.json({ comment });
  } catch (err) {
    console.error('AI API error:', err);
    return NextResponse.json(
      { error: 'サーバ内部エラー' },
      { status: 500 }
    );
  }
}
