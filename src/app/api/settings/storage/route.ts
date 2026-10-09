import { NextResponse } from 'next/server';
import { getStorageStatus } from '@/lib/db/storage';

export async function GET() {
  try {
    const status = getStorageStatus();
    return NextResponse.json(status);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to get storage status';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
