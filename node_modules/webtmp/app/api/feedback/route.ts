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

    console.log('feedback input', body);

    const completion = await client.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [
        {
          role: 'system',
          content:
            'あなたは学習コーチです。入力された日報に対して、100文字以内で、具体的かつポジティブなフィードバックを日本語で1つだけ返してください。',
        },
        {
          role: 'user',
          content: `学習内容: ${content}\n学習時間: ${
            studyTime ?? '不明'
          }時間\n完了タスク数: ${tasksCompleted ?? '不明'}件`,
        },
      ],
      max_completion_tokens: 120,
    });

    const msg = completion.choices[0]?.message;
    if (!msg) {
      return NextResponse.json(
        { comment: 'コメントを取得できませんでしたが、学習おつかれさま！' },
        { status: 200 }
      );
    }

    // ここを「このモデルの content は配列」と決め打ち
    const raw = msg.content as any;

    let commentText = '';

    if (typeof raw === 'string') {
      // 念のため string も拾う
      commentText = raw;
    } else if (Array.isArray(raw)) {
      commentText = raw
        .map((part: any) => {
          if (typeof part === 'string') return part;

          // よくあるパターンを順に潰す
          if (typeof part.text === 'string') return part.text;
          if (typeof part.content === 'string') return part.content;
          if (
            part.output_text &&
            typeof part.output_text.text === 'string'
          ) {
            return part.output_text.text;
          }

          return '';
        })
        .join('');
    } else {
      // 想定外のときはとりあえず文字列化
      commentText = String(raw ?? '');
    }

    console.log('feedback comment', commentText);

    if (!commentText.trim()) {
      return NextResponse.json(
        {
          comment:
            'コメントを取得できませんでしたが、今日の学習もちゃんと前進になってます。継続えらい。',
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ comment: commentText }, { status: 200 });
  } catch (e) {
    console.error('feedback api error', e);
    return NextResponse.json(
      { error: 'failed to fetch feedback' },
      { status: 500 }
    );
  }
}
