// app/api/feedback/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// なんでもいいから「テキスト」に潰す関数
function extractTextFromMessageContent(content: any): string {
  // 1) ふつうの string
  if (typeof content === 'string') {
    return content;
  }

  // 2) 配列（新APIのパーツ配列想定）
  if (Array.isArray(content)) {
    return content
      .map((part: any) => {
        if (!part) return '';

        // 純粋な string パーツ
        if (typeof part === 'string') return part;

        // part.text が色んな形で入っている可能性を片っ端から潰す
        const t = part.text;
        if (!t) return '';

        if (typeof t === 'string') return t;

        // [{ text: '...' }, { text: '...' }] みたいなパターン
        if (Array.isArray(t)) {
          return t
            .map((span: any) =>
              typeof span === 'string'
                ? span
                : span?.text ?? '',
            )
            .join('');
        }

        // { value: '...' } みたいなパターン
        if (typeof t === 'object' && t.value) {
          return String(t.value);
        }

        return '';
      })
      .join('');
  }

  // 3) オブジェクト単体で来たとき
  if (content && typeof content === 'object') {
    const t = (content as any).text;
    if (typeof t === 'string') return t;
    if (t && typeof t === 'object' && 'value' in t) {
      return String(t.value);
    }

    // 最悪 JSON 文字列にして返す（空よりマシ）
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
      model: 'gpt-5.1-mini', // ここは使いたいモデルに合わせる
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
          content: [
            {
              type: 'output_text',
              text: {
                value: `今日の学習内容: ${content}\n学習時間: ${studyTime ?? '不明'}時間\n完了タスク数: ${tasksCompleted ?? '不明'}件`,
              },
            },
          ],
        },
      ],
    });

    const msg = completion.choices[0]?.message;

    let commentText = '';

    if (msg && 'content' in msg) {
      // 型でゴネられるので any にキャストしてから専用関数に投げる
      const raw: any = (msg as any).content;
      commentText = extractTextFromMessageContent(raw);
    }

    console.log('feedback raw message', JSON.stringify(msg, null, 2));
    console.log('feedback comment', commentText);

    if (!commentText) {
      // ここで完全に空なら、フロントで出してるメッセージと同じ文言を返す
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
