import { NextRequest, NextResponse } from 'next/server';
import { getPatientProfile, updatePatientProfile } from '@/lib/db/storage';

export async function GET() {
  try {
    const profile = await getPatientProfile();
    return NextResponse.json({ profile });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch profile';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = await updatePatientProfile(body);
    return NextResponse.json({ success: true, profile: updated });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update profile';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
