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

{
  "name": "webtmp",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    // 既存の依存関係そのまま
  },
  "optionalDependencies": {
    "lightningcss-linux-x64-gnu": "^1.30.1"
  }
}
