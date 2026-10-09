import { describe, it, expect } from 'vitest';
import {
  recordToDbDocument,
  dbDocumentToRecord,
  verifyRecordAccess,
  getStorageStatus,
  getAllMedicalRecords,
  getMedicalRecordById,
} from '../db/storage';
import { MedicalDocumentRecord } from '../types/medical';

describe('Supabase Storage Adapter & Data Mappers', () => {
  const sampleRecord: MedicalDocumentRecord = {
    id: 'test-record-101',
    userId: 'user-abc-123',
    fileName: 'blood_test_cbc.pdf',
    fileSize: 45000,
    mimeType: 'application/pdf',
    filePath: '/uploads/blood_test_cbc.pdf',
    fileHash: 'abcdef1234567890',
    documentType: 'Lab Report',
    documentDate: '2026-03-20',
    uploadedAt: '2026-03-20T10:00:00Z',
    providerName: 'Metropolis Diagnostics',
    patientNameExtracted: 'Rajesh Verma',
    patientAgeExtracted: 48,
    rawExtractedText: 'Sample text...',
    extractionMethod: 'pymupdf',
    processingStatus: 'completed',
    observations: [
      {
        id: 'obs-1',
        testName: 'Hemoglobin',
        category: 'Hematology',
        testResultValue: '14.2',
        testResultNumeric: 14.2,
        unit: 'g/dL',
        referenceRangeRaw: '13.0 - 17.0',
        referenceRangeLow: 13.0,
        referenceRangeHigh: 17.0,
        flag: 'NORMAL',
        flagSource: 'source_reported',
        confidence: 1.0,
        requiresReview: false,
      },
    ],
    medications: [
      {
        id: 'med-1',
        medicationName: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '3 months',
        route: 'Oral',
        isActive: true,
        confidence: 1.0,
      },
    ],
    diagnoses: [
      {
        id: 'diag-1',
        conditionName: 'Type 2 Diabetes',
        icd10Code: 'E11',
        status: 'Active',
        confidence: 1.0,
      },
    ],
    summary: {
      id: 'sum-1',
      summaryEn: 'Patient shows controlled blood count.',
      summaryHi: 'रोगी की रक्त गणना सामान्य है।',
      keyFindings: ['Hemoglobin normal'],
      abnormalHighlights: [],
      doctorQuestions: ['Continue current dosage?'],
      modelUsed: 'gemini-3.1-flash-lite',
    },
  };

  it('correctly maps MedicalDocumentRecord to snake_case DbMedicalDocument', () => {
    const dbDoc = recordToDbDocument(sampleRecord);
    expect(dbDoc.id).toBe('test-record-101');
    expect(dbDoc.user_id).toBe('user-abc-123');
    expect(dbDoc.file_name).toBe('blood_test_cbc.pdf');
    expect(dbDoc.file_size).toBe(45000);
    expect(dbDoc.document_type).toBe('Lab Report');
    expect(dbDoc.provider_name).toBe('Metropolis Diagnostics');
    expect(dbDoc.patient_name_extracted).toBe('Rajesh Verma');
  });

  it('correctly reconstructs MedicalDocumentRecord from DbMedicalDocument', () => {
    const dbDoc = recordToDbDocument(sampleRecord);
    const reconstructed = dbDocumentToRecord(
      dbDoc,
      sampleRecord.observations,
      sampleRecord.medications,
      sampleRecord.diagnoses,
      sampleRecord.summary
    );

    expect(reconstructed.id).toBe(sampleRecord.id);
    expect(reconstructed.fileName).toBe(sampleRecord.fileName);
    expect(reconstructed.observations).toHaveLength(1);
    expect(reconstructed.observations[0].testName).toBe('Hemoglobin');
    expect(reconstructed.medications).toHaveLength(1);
    expect(reconstructed.medications[0].medicationName).toBe('Metformin');
    expect(reconstructed.diagnoses).toHaveLength(1);
    expect(reconstructed.summary.summaryEn).toBe(sampleRecord.summary.summaryEn);
    expect(reconstructed.summary.summaryHi).toBe(sampleRecord.summary.summaryHi);
  });

  it('correctly reports safe storage status without exposing secrets', () => {
    const status = getStorageStatus();
    expect(['local', 'supabase']).toContain(status.mode);
    expect(typeof status.configured).toBe('boolean');
    expect(typeof status.localRecordsCount).toBe('number');
    expect(status.localRecordsCount).toBeGreaterThanOrEqual(4);
    expect(['local_json', 'supabase_postgres']).toContain(status.provider);
  });

  describe('Authorization and Record Access Guard', () => {
    it('allows universal access to demo fixtures', () => {
      const demoRecord = { ...sampleRecord, id: 'demo-rec-001' };
      expect(verifyRecordAccess(demoRecord, undefined)).toBe(true);
      expect(verifyRecordAccess(demoRecord, 'other-user')).toBe(true);
    });

    it('allows access to unassigned guest records in local mode', () => {
      const guestRecord = { ...sampleRecord, id: 'guest-123', userId: undefined };
      expect(verifyRecordAccess(guestRecord, undefined)).toBe(true);
    });

    it('strictly enforces ownership match on user records', () => {
      const userRecord = { ...sampleRecord, userId: 'owner-user-777' };
      expect(verifyRecordAccess(userRecord, 'owner-user-777')).toBe(true);
      expect(verifyRecordAccess(userRecord, 'wrong-user-999')).toBe(false);
      expect(verifyRecordAccess(userRecord, undefined)).toBe(false);
    });
  });

  describe('Local JSON Fallback Retrieval', () => {
    it('loads existing demo records reliably', async () => {
      const records = await getAllMedicalRecords();
      expect(records.length).toBeGreaterThanOrEqual(4);
      const demo1 = records.find((r) => r.id === 'demo-rec-001');
      expect(demo1).toBeDefined();
      expect(demo1?.fileName).toContain('Metabolic');
    });

    it('fetches single record by ID', async () => {
      const record = await getMedicalRecordById('demo-rec-001');
      expect(record).not.toBeNull();
      expect(record?.id).toBe('demo-rec-001');
    });

    it('returns null for non-existent record ID', async () => {
      const record = await getMedicalRecordById('non-existent-id-99999');
      expect(record).toBeNull();
    });
  });
});
