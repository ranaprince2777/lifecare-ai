import { NextRequest, NextResponse } from 'next/server';
import { validateDocument } from '@/lib/pipeline/documentValidator';
import { extractDocumentText } from '@/lib/pipeline/textExtractor';
import { extractStructuredMedicalData } from '@/lib/pipeline/geminiExtractor';
import { saveMedicalRecord, getAllMedicalRecords } from '@/lib/db/storage';
import { MedicalDocumentRecord, ExtractionMethod, ProcessingStatus } from '@/lib/types/medical';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const clientApiKey = (formData.get('apiKey') as string | null) || req.headers.get('x-gemini-key') || undefined;
    const generateHindi = formData.get('generateHindi') === 'true';
    const patientId = (formData.get('patientId') as string | null) || undefined;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded. Please select a medical document.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Validate file
    const validation = validateDocument(buffer, file.name, file.type);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // 2. Duplicate detection check
    const existingRecords = await getAllMedicalRecords();
    const duplicate = existingRecords.find((r) => r.fileHash === validation.fileHash);
    if (duplicate) {
      return NextResponse.json(
        {
          error: `This document has already been uploaded previously as "${duplicate.fileName}" on ${duplicate.uploadedAt.split('T')[0]}.`,
          existingRecordId: duplicate.id,
          isDuplicate: true,
        },
        { status: 409 }
      );
    }

    // Save document file locally for preview or fallback (safe in serverless read-only filesystems)
    const safeFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const publicUrl = `/uploads/${safeFileName}`;
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const filePath = path.join(uploadsDir, safeFileName);
      fs.writeFileSync(filePath, buffer);
    } catch {
      // In read-only serverless filesystems (e.g. Vercel), fallback to /tmp
      try {
        const tmpPath = path.join('/tmp', safeFileName);
        fs.writeFileSync(tmpPath, buffer);
      } catch {
        // Continue gracefully
      }
    }

    // 3. Extract text / OCR
    const extractionResult = await extractDocumentText(buffer, validation.mimeType!, file.name);

    if (!extractionResult.success && extractionResult.insufficientText) {
      return NextResponse.json(
        {
          error: extractionResult.error || 'The document contains insufficient or unreadable text. Please upload a clearer scan.',
          insufficientText: true,
        },
        { status: 422 }
      );
    }

    const rawExtractedText = extractionResult.text || '';
    const extractionMethod: ExtractionMethod = extractionResult.method;

    // 4. Structured Medical Extraction with Gemini
    const aiResult = await extractStructuredMedicalData(rawExtractedText, {
      apiKey: clientApiKey,
      generateHindi,
    });

    const recordId = randomUUID();
    let processingStatus: ProcessingStatus = 'completed';
    let errorMessage: string | null = null;

    let payload: import('@/lib/types/medical').MedicalExtractionPayload | undefined = aiResult.data;

    // If Gemini was unavailable (e.g. no API key configured) or data is missing
    if (!aiResult.success || !payload) {
      processingStatus = 'failed';
      errorMessage = aiResult.error || 'Gemini extraction unavailable';

      // Fallback empty structured template so the document is still saved and can be retried
      payload = {
        documentType: 'Other',
        documentDate: new Date().toISOString().split('T')[0],
        providerName: null,
        patientName: null,
        patientAge: null,
        observations: [],
        medications: [],
        diagnoses: [],
        summaryEn: 'Document text was extracted successfully, but AI clinical extraction requires a Gemini API key. Please configure your key in Settings and click Retry Extraction.',
        summaryHi: null,
        keyFindings: ['Document ingested and OCR text extracted.'],
        abnormalHighlights: [],
        doctorQuestions: ['Discuss this report with your consulting physician.'],
      };
    }

    // 5. Construct full record
    const record: MedicalDocumentRecord = {
      id: recordId,
      patientId: patientId || undefined,
      fileName: file.name,
      fileSize: validation.sizeBytes!,
      mimeType: validation.mimeType!,
      filePath: publicUrl,
      fileHash: validation.fileHash!,
      documentType: payload.documentType,
      documentDate: payload.documentDate || null,
      uploadedAt: new Date().toISOString(),
      providerName: payload.providerName || null,
      patientNameExtracted: payload.patientName || null,
      patientAgeExtracted: payload.patientAge || null,
      rawExtractedText,
      extractionMethod,
      processingStatus,
      errorMessage,
      observations: payload.observations || [],
      medications: payload.medications || [],
      diagnoses: payload.diagnoses || [],
      summary: {
        id: randomUUID(),
        summaryEn: payload.summaryEn,
        summaryHi: payload.summaryHi || null,
        keyFindings: payload.keyFindings || [],
        abnormalHighlights: payload.abnormalHighlights || [],
        doctorQuestions: payload.doctorQuestions || [],
        modelUsed: 'gemini-3.1-flash-lite',
      },
    };

    // 6. Save in persistent storage
    await saveMedicalRecord(record);

    return NextResponse.json({
      success: true,
      recordId: record.id,
      record,
      aiExtractionSuccess: aiResult.success,
      warning: !aiResult.success ? aiResult.error : undefined,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json({ error: `Upload processing failed: ${msg}` }, { status: 500 });
  }
}
