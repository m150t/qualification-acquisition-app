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
  model: "gpt-4.1-mini",
  messages: [
    {
      role: "system",
      content:
        "ユーザーの勉強内容に対する励ましコメントを必ず返してください。空文字は禁止。"
    },
    {
      role: "user",
      content: `今日の学習内容: ${content}\n学習時間:${studyTime}\n完了タスク:${tasksCompleted}`
    }
  ]
});

const msg = completion.choices?.[0]?.message;
const commentText = msg?.content?.trim() || "今日もお疲れさま！よく頑張ったね。";

console.log("feedback raw message", msg);
console.log("feedback comment", commentText);

    if (console.log("feedback comment", commentText);

if (!commentText) {
  // 本当に空だったときだけ fallback
  return NextResponse.json(
    {
      comment: 'コメントを取得できませんでした（content が空でした）。',
    },
    { status: 200 },
  );
}
) {
      // 本当に空だったときだけ fallback
      return NextResponse.json({
        comment:
          'コメントを取得できませんでした（content が空でした）。',
      });
    }

    return NextResponse.json({ comment:commentText  });
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
