import { NextRequest, NextResponse } from 'next/server';
import { getPatientProfile, updatePatientProfile, getPatientById } from '@/lib/db/storage';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId') || undefined;
    const profile = patientId
      ? (await getPatientById(patientId)) || (await getPatientProfile())
      : await getPatientProfile();
    return NextResponse.json({ profile });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch profile';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId') || body.id || undefined;
    const updated = await updatePatientProfile(patientId || body, body);
    return NextResponse.json({ success: true, profile: updated });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update profile';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
