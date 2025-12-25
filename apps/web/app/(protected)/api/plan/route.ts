// apps/web/app/api/plan/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from '@/src/lib/dynamodb';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CERTIFICATIONS_TABLE =
  process.env.DDB_CERTIFICATIONS_TABLE || 'Certifications';

type GeneratePlanRequest = {
  goal: {
    certCode?: string;
    certName: string;
    examDate: string;      // YYYY-MM-DD
    weeklyHours: number | null;   // 目標学習時間（時間）
  };
};

type ExamGuide =
  | string
  | {
      summary?: string;
      topics?: string[];
      sourceUrl?: string;
      notes?: string;
    };

function formatExamGuide(guide: ExamGuide | undefined): string | null {
  if (!guide) return null;
  if (typeof guide === 'string') {
    return guide.trim() || null;
  }
  const lines: string[] = [];
  if (guide.summary) lines.push(`概要: ${guide.summary}`);
  if (Array.isArray(guide.topics) && guide.topics.length > 0) {
    lines.push(`主要トピック:\n- ${guide.topics.join('\n- ')}`);
  }
  if (guide.notes) lines.push(`備考: ${guide.notes}`);
  if (guide.sourceUrl) lines.push(`参照URL: ${guide.sourceUrl}`);
  const formatted = lines.join('\n');
  return formatted.trim() || null;
}

async function fetchExamGuide(certCode?: string): Promise<string | null> {
  if (!certCode) return null;
  try {
    const res = await ddb.send(
      new GetCommand({
        TableName: CERTIFICATIONS_TABLE,
        Key: { code: certCode },
      }),
    );
    const item = res.Item as { examGuide?: ExamGuide; examGuideText?: string } | undefined;
    return formatExamGuide(item?.examGuide ?? item?.examGuideText);
  } catch (error) {
    console.error('failed to load exam guide', error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GeneratePlanRequest;
    const { goal } = body;

    if (!goal?.certName || !goal?.examDate) {
      return NextResponse.json(
        { error: 'goal.certName と goal.examDate は必須です' },
        { status: 400 },
      );
    }

    const examGuide = await fetchExamGuide(goal.certCode);
    const examGuideSection = examGuide
      ? `\n試験ガイド情報:\n${examGuide}\n`
      : '\n試験ガイド情報: 未登録\n';

    const prompt = `
資格名: ${goal.certName}
試験日: ${goal.examDate}
目標の学習時間: ${goal.weeklyHours ?? '未設定'} 時間
${examGuideSection}

上記をもとに、試験日までの学習計画を立ててください。
レスポンスは必ず JSON 配列のみで返してください。各要素は以下の形式：
{
  "date": "YYYY-MM-DD",
  "theme": "その日の学習テーマ",
  "tasks": ["具体的なタスク1", "具体的なタスク2"]
}
`;

    const completion = await client.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [
        {
          role: 'system',
          content:
            'あなたは資格学習のコーチです。ユーザーの試験日から逆算して、現実的な日次学習計画を JSON で返してください。',
        },
        { role: 'user', content: prompt },
      ],
    });

    const msg = completion.choices[0]?.message;
    const text = (msg?.content ?? '').toString().trim();

    console.log('plan raw message', msg);

    let plan: Array<Record<string, unknown>> = [];

    try {
      if (text) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          plan = parsed as Array<Record<string, unknown>>;
        }
      }
    } catch (e) {
      console.error('failed to parse plan JSON', e, text);
      // パース失敗時は空配列で返す
      plan = [];
    }

    return NextResponse.json({ plan });
  } catch (e: unknown) {
    console.error('plan api error', e);
    return NextResponse.json(
      {
        error: '学習計画の生成に失敗しました',
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 500 },
    );
  }
}
