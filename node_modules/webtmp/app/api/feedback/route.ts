// app/api/feedback/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error('OPENAI_API_KEY is not set on server'); // デバッグ用
      return NextResponse.json(
        { error: 'サーバ側の設定エラー: OPENAI_API_KEY が設定されていません' },
        { status: 500 },
      );
    }

    const client = new OpenAI({ apiKey });

    const body = await req.json();
    const { content, studyTime, tasksCompleted } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'content がありません' },
        { status: 400 },
      );
    }

    const completion = await client.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [
        {
          role: 'system',
          content:
            'あなたは資格学習の日報に一言コメントするコーチです。やさしく短くコメントしてください。',
        },
        {
          role: 'user',
          content: `
今日の学習内容: ${content}
学習時間: ${studyTime ?? '不明'} 時間
完了タスク数: ${tasksCompleted ?? '不明'} 件
        `.trim(),
        },
      ],
      max_completion_tokens: 200,
    });

    const comment = completion.choices[0]?.message?.content ?? '';

    return NextResponse.json({ comment });
  } catch (e) {
    console.error('feedback api error', e);
    return NextResponse.json(
      { error: 'AIコメント生成に失敗しました' },
      { status: 500 },
    );
  }
}