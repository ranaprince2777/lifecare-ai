import { NextRequest, NextResponse } from 'next/server';
import { getAllPatients, createPatient } from '@/lib/db/storage';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.toLowerCase();

    let patients = await getAllPatients();

    if (query) {
      patients = patients.filter(
        (p) =>
          p.fullName.toLowerCase().includes(query) ||
          p.id.toLowerCase().includes(query) ||
          (p.mockAbhaId && p.mockAbhaId.toLowerCase().includes(query)) ||
          (p.chronicConditions && p.chronicConditions.some((c) => c.toLowerCase().includes(query)))
      );
    }

    return NextResponse.json({
      success: true,
      patients,
      total: patients.length,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch patients';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.fullName || typeof body.fullName !== 'string' || !body.fullName.trim()) {
      return NextResponse.json({ error: 'Patient full name is required.' }, { status: 400 });
    }

    const newPatient = await createPatient({
      fullName: body.fullName.trim(),
      age: body.age ? Number(body.age) : undefined,
      gender: body.gender || 'Unknown',
      bloodGroup: body.bloodGroup || null,
      mockAbhaId: body.mockAbhaId || undefined,
      contact: body.contact || undefined,
      emergencyContact: body.emergencyContact || undefined,
      chronicConditions: Array.isArray(body.chronicConditions) ? body.chronicConditions : [],
      allergies: Array.isArray(body.allergies) ? body.allergies : [],
      isDemo: Boolean(body.isDemo),
    });

    return NextResponse.json({
      success: true,
      patient: newPatient,
    }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create patient';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
