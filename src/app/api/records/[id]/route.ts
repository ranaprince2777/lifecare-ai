import { NextRequest, NextResponse } from 'next/server';
import { getMedicalRecordById, saveMedicalRecord, deleteMedicalRecord } from '@/lib/db/storage';
import { extractStructuredMedicalData } from '@/lib/pipeline/geminiExtractor';

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
    return NextResponse.json({ record });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error fetching record';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = await getMedicalRecordById(id);
    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const updates = await req.json();

    // Support updating observations (review flag or edited values)
    if (updates.observations) {
      record.observations = updates.observations;
    }
    if (updates.medications) {
      record.medications = updates.medications;
    }
    if (updates.diagnoses) {
      record.diagnoses = updates.diagnoses;
    }
    if (updates.documentType) {
      record.documentType = updates.documentType;
    }
    if (updates.documentDate !== undefined) {
      record.documentDate = updates.documentDate;
    }

    const saved = await saveMedicalRecord(record);
    return NextResponse.json({ success: true, record: saved });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error updating record';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = await getMedicalRecordById(id);
    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const body = await req.json();
    if (body.action === 'retry_ai') {
      const apiKey = body.apiKey || req.headers.get('x-gemini-key') || undefined;
      const generateHindi = body.generateHindi !== false;

      const aiResult = await extractStructuredMedicalData(record.rawExtractedText, {
        apiKey,
        generateHindi,
      });

      if (!aiResult.success) {
        return NextResponse.json({ error: aiResult.error }, { status: 400 });
      }

      const p = aiResult.data!;
      record.documentType = p.documentType;
      record.documentDate = p.documentDate || record.documentDate;
      record.providerName = p.providerName || record.providerName;
      record.patientNameExtracted = p.patientName || record.patientNameExtracted;
      record.patientAgeExtracted = p.patientAge || record.patientAgeExtracted;
      record.observations = p.observations || [];
      record.medications = p.medications || [];
      record.diagnoses = p.diagnoses || [];
      record.summary = {
        ...record.summary,
        summaryEn: p.summaryEn,
        summaryHi: p.summaryHi || null,
        keyFindings: p.keyFindings || [],
        abnormalHighlights: p.abnormalHighlights || [],
        doctorQuestions: p.doctorQuestions || [],
        modelUsed: 'gemini-3.1-flash-lite',
      };
      record.processingStatus = 'completed';
      record.errorMessage = null;

      const saved = await saveMedicalRecord(record);
      return NextResponse.json({ success: true, record: saved });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error processing request';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteMedicalRecord(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Record deleted successfully' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error deleting record';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
