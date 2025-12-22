/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/feedback/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// content が string でも配列でもオブジェクトでも、とにかく文字列に潰す保険関数
function extractTextFromMessageContent(content: any): string {
  if (!content) return '';

  // 1) ふつうの string
  if (typeof content === 'string') {
    return content;
  }

  // 2) 配列（新仕様で [ { type: 'text', text: '...' }, ... ] 的なやつ）
  if (Array.isArray(content)) {
    return content
      .map((part: any) => {
        if (!part) return '';

        if (typeof part === 'string') return part;

        // { type: 'text', text: '...' }
        if (
          (part.type === 'text' || part.type === 'output_text') &&
          typeof part.text === 'string'
        ) {
          return part.text;
        }

        // { text: '...' }
        if (typeof part.text === 'string') {
          return part.text;
        }

        // { text: [ { text: '...' } ] }
        if (Array.isArray(part.text)) {
          return part.text
            .map((t: any) => {
              if (!t) return '';
              if (typeof t === 'string') return t;
              if (typeof t.text === 'string') return t.text;
              return '';
            })
            .join('');
        }

        return '';
      })
      .join('');
  }

  // 3) オブジェクト単体
  if (typeof content === 'object') {
    // { type: 'text', text: '...' }
    if (
      (content as any).type === 'text' &&
      typeof (content as any).text === 'string'
    ) {
      return (content as any).text;
    }

    if (typeof (content as any).text === 'string') {
      return (content as any).text;
    }

    if (Array.isArray((content as any).text)) {
      return (content as any).text
        .map((t: any) => {
          if (!t) return '';
          if (typeof t === 'string') return t;
          if (typeof t.text === 'string') return t.text;
          return '';
        })
        .join('');
    }

    try {
      return JSON.stringify(content);
    } catch {
      return '';
    }
  }

  return '';
}

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
      model: 'gpt-5-nano', // ここは今使ってるモデルでOK
      max_completion_tokens: 300,
      messages: [
        {
          role: 'system',
          content:
            'あなたは資格学習を応援する優しいコーチです。' +
            '学習内容を褒めつつ、「次に何をやると良いか」を1〜2個具体的に提案してください。',
        },
        {
          role: 'user',
          // ← ここを **ただの string** に戻す
          content: `今日の学習内容: ${content}\n学習時間: ${
            studyTime ?? '不明'
          }時間\n完了タスク数: ${tasksCompleted ?? '不明'}件`,
        },
      ],
    });

    const msg = completion.choices[0]?.message;

    let commentText = '';

    if (msg && 'content' in msg) {
      const raw: any = (msg as any).content;
      commentText = extractTextFromMessageContent(raw);
    }

    console.log('feedback raw message', JSON.stringify(msg, null, 2));
    console.log('feedback comment', commentText);

    if (!commentText) {
      return NextResponse.json({
        comment:
          'コメントを取得できませんでした（content のパースに失敗しました）。',
      });
    }

    return NextResponse.json({ comment: commentText });
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
