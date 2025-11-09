import { NextRequest, NextResponse } from 'next/server';
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const from = url.searchParams.get('from') ?? '2025-11-10';
  const to = url.searchParams.get('to') ?? '2025-11-16';
  return NextResponse.json([
    { uid:'demo', date: from, theme:'IAM', status:'planned' },
    { uid:'demo', date: to,   theme:'EC2', status:'done' }
  ]);
}