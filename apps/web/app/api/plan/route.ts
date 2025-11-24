// apps/web/app/api/plan/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'no_api_key' },
        { status: 500 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const { certCode, examDate, weeklyHours } = body as {
      certCode?: string;
      examDate?: string;
      weeklyHours?: number | null;
    };

    if (!certCode || !examDate) {
      return NextResponse.json(
        { error: 'bad_request' },
        { status: 400 },
      );
    }

    const userInfoText = `
資格コード: ${certCode}
試験日: ${examDate}
目安の週あたり学習時間: ${weeklyHours ?? '未指定'}
`.trim();

    const completion = await client.chat.completions.create({
      model: 'gpt-5-nano',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'あなたは資格取得の学習コーチです。必ず JSON オブジェクトだけを返してください。' +
            'フォーマットは {"plan":[{"week":1,"theme":"テーマ","topics":["トピック1","トピック2"]}, ...]} です。',
        },
        {
          role: 'user',
          content:
            '以下の受験情報に基づいて、8〜12週間程度の学習計画を作ってください。' +
            '各 week にはテーマと、具体的な学習内容 topics を3〜5件入れてください。\n\n' +
            userInfoText,
        },
      ],
    });

    const raw = completion.choices[0].message.content ?? '{}';

    let parsed: any = {};
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error('failed to parse plan json', e, raw);
      return NextResponse.json(
        { error: 'parse_error' },
        { status: 500 },
      );
    }

    const plan = Array.isArray(parsed.plan) ? parsed.plan : [];

    return NextResponse.json({ plan });
  } catch (e) {
    console.error('plan api error', e);
    return NextResponse.json(
      { error: 'openai_error' },
      { status: 500 },
    );
  }
}
