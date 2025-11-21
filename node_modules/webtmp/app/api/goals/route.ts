// apps/web/app/api/goals/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    console.log('API /api/goals called. body =', body);

    return NextResponse.json(
      { ok: true, message: 'dummy save OK', received: body },
      { status: 200 },
    );
  } catch (e) {
    console.error('API /api/goals error', e);
    return NextResponse.json(
      { ok: false, error: 'unexpected error in /api/goals' },
      { status: 500 },
    );
  }
}
