// apps/web/app/api/reports/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    console.log('API /api/reports called. body =', body);

    // ここでは何も保存せず、ただ受け取った内容を返すだけ
    return NextResponse.json(
      { ok: true, message: 'dummy report save OK', received: body },
      { status: 200 },
    );
  } catch (e) {
    console.error('API /api/reports error', e);
    return NextResponse.json(
      { ok: false, error: 'unexpected error in /api/reports' },
      { status: 500 },
    );
  }
}
