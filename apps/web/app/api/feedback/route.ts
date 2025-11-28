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
    const msg = completion.choices[0]?.message;
    let commentText = '';

    if (typeof msg?.content === 'string') {
      commentText = msg.content;
    } else if (Array.isArray(msg?.content)) {
      // content が配列の場合（multi-part）
      commentText = msg.content
        .map((part: any) => {
          if (typeof part === 'string') return part;
          if (typeof part?.text === 'string') return part.text;
          if (typeof part?.content === 'string') return part.content;
          return '';
        })
        .join('');
    }

    console.log('feedback comment', commentText);

    if (!commentText) {
      return NextResponse.json(
        {
          comment:
            'コメントを取得できませんでしたが、学習おつかれさま！自分なりに続けられているだけで十分えらいです。',
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'AIコメント生成に失敗しました' },
      { status: 500 },
    );
  }
}
