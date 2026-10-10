import { NextRequest, NextResponse } from 'next/server';
import { getAllMedicalRecords, saveMedicalRecord, resetDemoData } from '@/lib/db/storage';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const query = searchParams.get('q')?.toLowerCase();
    const patientId = searchParams.get('patientId') || undefined;

    let records = await getAllMedicalRecords(undefined, patientId);

    if (type && type !== 'All') {
      records = records.filter((r) => r.documentType === type);
    }

    if (query) {
      records = records.filter(
        (r) =>
          r.fileName.toLowerCase().includes(query) ||
          (r.providerName && r.providerName.toLowerCase().includes(query)) ||
          r.documentType.toLowerCase().includes(query) ||
          r.observations.some((o) => o.testName.toLowerCase().includes(query)) ||
          r.medications.some((m) => m.medicationName.toLowerCase().includes(query)) ||
          r.diagnoses.some((d) => d.conditionName.toLowerCase().includes(query))
      );
    }

    return NextResponse.json({ records, total: records.length });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch records';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === 'reset_demo') {
      await resetDemoData();
      const records = await getAllMedicalRecords();
      return NextResponse.json({ success: true, message: 'Reset to demo fixtures', records });
    }

    const saved = await saveMedicalRecord(body);
    return NextResponse.json({ success: true, record: saved });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to save record';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
