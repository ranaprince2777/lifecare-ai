import { NextRequest, NextResponse } from 'next/server';
import { getMedicalRecordById, getPatientProfile } from '@/lib/db/storage';
import { mapToFHIRBundle } from '@/lib/fhir/fhirMapper';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = await getMedicalRecordById(id);
    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const patient = await getPatientProfile();
    const fhirBundle = mapToFHIRBundle(record, patient);

    return NextResponse.json(fhirBundle, {
      headers: {
        'Content-Type': 'application/fhir+json; charset=utf-8',
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to generate FHIR bundle';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
