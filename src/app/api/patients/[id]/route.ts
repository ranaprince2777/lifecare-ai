import { NextRequest, NextResponse } from 'next/server';
import { getPatientById, updatePatientProfile, deletePatient, getAllMedicalRecords } from '@/lib/db/storage';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const patient = await getPatientById(id);

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Also fetch associated medical records for this patient
    const records = await getAllMedicalRecords(undefined, id);

    return NextResponse.json({
      success: true,
      patient,
      records,
      documentCount: records.length,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch patient';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await updatePatientProfile(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      patient: updated,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update patient';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await deletePatient(id);
    if (!success) {
      return NextResponse.json({ error: 'Patient not found or could not be deleted' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Patient deleted successfully',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to delete patient';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
