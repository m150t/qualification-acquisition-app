// apps/web/app/api/feedback/route.ts
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
        { status: 400 },
      );
    }

    console.log('feedback input', { content, studyTime, tasksCompleted });

    const completion = await client.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [
        {
          role: 'system',
          content:
            'あなたは学習コーチです。日報を読んで、優しく具体的なフィードバックを日本語で120文字程度で返してください。',
        },
        {
          role: 'user',
          content: `
今日の学習内容:
${content}

学習時間: ${studyTime ?? '不明'} 時間
完了タスク数: ${tasksCompleted ?? '不明'} 件
`,
        },
      ],
      max_completion_tokens: 200,
    });

    // ★ ここだけシンプルに
    const raw = completion.choices[0]?.message?.content;
    const commentText =
      typeof raw === 'string'
        ? raw
        : ''; // 文字列じゃなければ空にしておく

    console.log('feedback comment', commentText);

    return NextResponse.json({ comment: commentText });
  } catch (err) {
    console.error('feedback api error', err);
    return NextResponse.json(
      { error: 'AIコメント生成に失敗しました' },
      { status: 500 },
    );
  }
}
