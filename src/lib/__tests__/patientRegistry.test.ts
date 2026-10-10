import { describe, it, expect } from 'vitest';
import {
  getAllPatients,
  getPatientById,
  createPatient,
  getAllMedicalRecords,
  getDashboardMetrics,
  saveMedicalRecord,
  enrichRecordPatientId,
  verifyRecordAccess,
} from '../db/storage';
import { MedicalDocumentRecord } from '../types/medical';

describe('Patient Registry & Document-Driven Data Integration', () => {
  it('loads patient directory with baseline patients', async () => {
    const patients = await getAllPatients();
    expect(patients.length).toBeGreaterThanOrEqual(3);

    // Verify baseline patients exist
    const meera = patients.find((p) => p.fullName === 'Meera Nambiar');
    expect(meera).toBeDefined();
    expect(meera?.gender).toBe('Female');

    const demoPatient = patients.find((p) => p.isDemo === true);
    expect(demoPatient).toBeDefined();
    expect(demoPatient?.isDemo).toBe(true);
  });

  it('creates a new verified patient in registry with stable ID', async () => {
    const testPatient = await createPatient({
      fullName: 'Aarav Patel',
      age: 34,
      gender: 'Male',
      bloodGroup: 'B+',
      mockAbhaId: '91-1122-3344-5566',
      chronicConditions: ['Seasonal Allergies'],
      allergies: ['Penicillin'],
      isDemo: false,
    });

    expect(testPatient.id).toMatch(/^pat-/);
    expect(testPatient.fullName).toBe('Aarav Patel');
    expect(testPatient.age).toBe(34);
    expect(testPatient.bloodGroup).toBe('B+');
    expect(testPatient.isDemo).toBe(false);

    // Verify patient can be retrieved by ID
    const retrieved = await getPatientById(testPatient.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(testPatient.id);
    expect(retrieved?.fullName).toBe('Aarav Patel');
  });

  it('enriches document records with patientId mapping', () => {
    const docWithPatientName: Partial<MedicalDocumentRecord> = {
      id: 'doc-auto-link-1',
      fileName: 'meera_lipid_panel.pdf',
      patientNameExtracted: 'Meera Nambiar',
    };

    const enriched = enrichRecordPatientId(docWithPatientName as MedicalDocumentRecord);
    expect(enriched.patientId).toBe('pat-meera-nambiar');

    // Synthetic or unknown name maps to deterministic patient ID
    const docUnknown: Partial<MedicalDocumentRecord> = {
      id: 'doc-auto-link-2',
      fileName: 'unknown_patient_report.pdf',
      patientNameExtracted: 'Devendra Joshi',
    };
    const unknownEnriched = enrichRecordPatientId(docUnknown as MedicalDocumentRecord);
    expect(unknownEnriched.patientId).toBe('pat-devendra-joshi');
  });

  it('associates uploaded document with specific patient and isolates records', async () => {
    const customPatient = await createPatient({
      fullName: 'Kavita Sundaram',
      age: 52,
      gender: 'Female',
      isDemo: false,
    });

    const newDoc: MedicalDocumentRecord = {
      id: `doc-${Date.now()}-test`,
      patientId: customPatient.id,
      fileName: 'kavita_blood_sugar.pdf',
      fileSize: 12400,
      mimeType: 'application/pdf',
      filePath: '/uploads/kavita_blood_sugar.pdf',
      fileHash: `hash-${Date.now()}`,
      documentType: 'Lab Report',
      documentDate: '2026-04-10',
      uploadedAt: new Date().toISOString(),
      providerName: 'Apollo Diagnostics',
      patientNameExtracted: 'Kavita Sundaram',
      patientAgeExtracted: 52,
      rawExtractedText: 'Fasting Blood Sugar: 142 mg/dL (Reference: 70-99)',
      extractionMethod: 'pdf_embedded',
      processingStatus: 'completed',
      observations: [
        {
          id: 'obs-fbs-1',
          testName: 'Fasting Blood Sugar',
          category: 'Biochemistry',
          testResultValue: '142',
          testResultNumeric: 142,
          unit: 'mg/dL',
          referenceRangeRaw: '70 - 99 mg/dL',
          referenceRangeLow: 70,
          referenceRangeHigh: 99,
          flag: 'HIGH',
          flagSource: 'calculated',
          confidence: 0.98,
          requiresReview: false,
        },
      ],
      medications: [
        {
          id: 'med-glip-1',
          medicationName: 'Glimepiride',
          dosage: '1mg',
          frequency: 'Once daily before breakfast',
          route: 'Oral',
          isActive: true,
          confidence: 0.95,
        },
      ],
      diagnoses: [
        {
          id: 'diag-t2d-1',
          conditionName: 'Type 2 Diabetes Mellitus',
          status: 'Active',
          confidence: 0.95,
          providerNotes: 'Elevated fasting glycemia',
        },
      ],
      summary: {
        id: 'sum-1',
        summaryEn: 'Fasting blood sugar is elevated at 142 mg/dL. Glimepiride 1mg prescribed.',
        modelUsed: 'gemini-3.1-flash-lite',
        keyFindings: ['Elevated fasting glucose'],
        abnormalHighlights: ['Fasting Blood Sugar: 142 mg/dL (High)'],
        doctorQuestions: ['Review diet and follow up in 4 weeks'],
      },
    };

    await saveMedicalRecord(newDoc);

    // Retrieve records specifically for Kavita
    const kavitaRecords = await getAllMedicalRecords(undefined, customPatient.id);
    expect(kavitaRecords.some((r) => r.id === newDoc.id)).toBe(true);

    // Verify patient isolation: another patient does NOT receive Kavita's records
    const meeraRecords = await getAllMedicalRecords(undefined, 'pat-meera-nambiar');
    expect(meeraRecords.every((r) => r.patientId !== customPatient.id)).toBe(true);
  });

  it('calculates dynamic data-driven dashboard metrics correctly', async () => {
    // 1. Aggregate metrics across all patients
    const aggregateMetrics = await getDashboardMetrics();
    expect(aggregateMetrics.isAggregate).toBe(true);
    expect(aggregateMetrics.totalPatients).toBeGreaterThanOrEqual(3);
    expect(aggregateMetrics.totalDocuments).toBeGreaterThanOrEqual(1);
    expect(aggregateMetrics.totalObservations).toBeGreaterThanOrEqual(1);

    // 2. Patient-specific metrics
    const patientMetrics = await getDashboardMetrics('pat-meera-nambiar');
    expect(patientMetrics.isAggregate).toBe(false);
    expect(patientMetrics.selectedPatientId).toBe('pat-meera-nambiar');
    expect(patientMetrics.selectedPatient?.fullName).toBe('Meera Nambiar');
    expect(typeof patientMetrics.abnormalObservationsCount).toBe('number');
  });

  it('handles empty states gracefully for a patient with zero documents', async () => {
    const emptyPatient = await createPatient({
      fullName: 'Vikram Seth',
      age: 28,
      gender: 'Male',
      isDemo: false,
    });

    const patientRecords = await getAllMedicalRecords(undefined, emptyPatient.id);
    expect(patientRecords).toEqual([]);

    const metrics = await getDashboardMetrics(emptyPatient.id);
    expect(metrics.totalDocuments).toBe(0);
    expect(metrics.totalObservations).toBe(0);
    expect(metrics.abnormalObservationsCount).toBe(0);
    expect(metrics.activeMedicationsCount).toBe(0);
    expect(metrics.recentUploads).toEqual([]);
    expect(metrics.recentAbnormalities).toEqual([]);
  });

  it('preserves provenance of extracted observations linked to document and patient', async () => {
    const allRecords = await getAllMedicalRecords();
    const recordsWithObs = allRecords.filter((r) => r.observations && r.observations.length > 0);

    for (const record of recordsWithObs) {
      expect(record.fileName).toBeTruthy();
      expect(record.documentType).toBeTruthy();
      expect(record.id).toBeTruthy();
      for (const obs of record.observations) {
        expect(obs.testName).toBeTruthy();
        expect(obs.testResultValue).toBeTruthy();
        // Deterministic flag classification
        expect(['NORMAL', 'HIGH', 'LOW', 'CRITICAL_HIGH', 'CRITICAL_LOW', 'UNCLASSIFIED']).toContain(obs.flag);
      }
    }
  });

  it('enforces patient authorization and security verification', () => {
    const demoRecord = { id: 'demo-record-001', extractionMethod: 'demo_fixture' } as MedicalDocumentRecord;
    const patientRecord = { id: 'rec-1', userId: 'pat-meera-001' } as MedicalDocumentRecord;
    const privateRecord = { id: 'private-rec-999', userId: 'owner-user-777' } as MedicalDocumentRecord;

    // Demo fixtures are universally accessible
    expect(verifyRecordAccess(demoRecord, 'any-user')).toBe(true);

    // Patient records matching requesting user are allowed
    expect(verifyRecordAccess(patientRecord, 'pat-meera-001')).toBe(true);

    // Private owner record is guarded from unauthorized cross-tenant requests
    expect(verifyRecordAccess(privateRecord, 'requesting-user-123')).toBe(false);
    expect(verifyRecordAccess(privateRecord, 'owner-user-777')).toBe(true);
  });
});
