import { NextRequest, NextResponse } from 'next/server';
import { getDashboardMetrics } from '@/lib/db/storage';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId') || undefined;

    const stats = await getDashboardMetrics(patientId);

    return NextResponse.json(
      {
        success: true,
        stats,
      },
      {
        headers: {
          'Cache-Control': 'private, s-maxage=5, stale-while-revalidate=30',
        },
      }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to calculate dashboard metrics';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
