// apps/web/app/api/certifications/route.ts
import { NextResponse } from 'next/server';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from '@/src/lib/dynamodb';
import type { Certification } from '@/src/lib/certifications';

const CERTIFICATIONS_TABLE =
  process.env.DDB_CERTIFICATIONS_TABLE || 'Certifications';

export async function GET() {
  try {
    const certifications: Certification[] = [];
    let lastEvaluatedKey: Record<string, unknown> | undefined;

    do {
      const res = await ddb.send(
        new ScanCommand({
          TableName: CERTIFICATIONS_TABLE,
          ExclusiveStartKey: lastEvaluatedKey,
        }),
      );

      if (Array.isArray(res.Items)) {
        res.Items.forEach((item) => {
          const cert = item as Certification;
          if (cert?.code && cert?.name) {
            certifications.push(cert);
          }
        });
      }

      lastEvaluatedKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (lastEvaluatedKey);

    certifications.sort((a, b) => a.name.localeCompare(b.name, 'ja'));

    return NextResponse.json({ certifications });
  } catch (error) {
    console.error('certifications GET error', error);
    return NextResponse.json(
      { error: 'failed to load certifications' },
      { status: 500 },
    );
  }
}
