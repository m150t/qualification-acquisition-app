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
`.trim();

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini', // or 'gpt-5-nano' でもOK
      messages: [
        {
          role: 'system',
          content:
            'あなたは資格学習をサポートするチューターです。励ましつつ、改善点も具体的に一つ示してください。全体は300文字以内で日本語。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      // ❌ max_tokens は絶対に書かない
      // ❌ max_completion_tokens も一旦なしで動かす
    });

    const comment =
      completion.choices?.[0]?.message?.content ??
      'コメント生成に失敗しました。';

    return NextResponse.json({ comment });
  } catch (err) {
    console.error('AI API error:', err);
    return NextResponse.json(
      { error: 'サーバ内部エラー' },
      { status: 500 }
    );
  }
}
