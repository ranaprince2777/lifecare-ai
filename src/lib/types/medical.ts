import { z } from 'zod';

export type DocumentType =
  | 'Lab Report'
  | 'Prescription'
  | 'Diagnostic Report'
  | 'Discharge Summary'
  | 'Other';

export type ProcessingStatus =
  | 'pending'
  | 'extracting_text'
  | 'structuring_ai'
  | 'completed'
  | 'failed';

export type ExtractionMethod =
  | 'pdf_embedded'
  | 'ocr_tesseract'
  | 'pymupdf'
  | 'manual_fallback'
  | 'demo_fixture';

export type ObservationFlag =
  | 'NORMAL'
  | 'HIGH'
  | 'LOW'
  | 'CRITICAL_HIGH'
  | 'CRITICAL_LOW'
  | 'UNCLASSIFIED';

// Zod schemas for AI extraction and runtime validation
export const ExtractedObservationSchema = z.object({
  id: z.string().optional(),
  testName: z.string().min(1),
  category: z.string().default('General'),
  testResultValue: z.string().min(1),
  testResultNumeric: z.number().nullable().optional(),
  unit: z.string().nullable().optional(),
  referenceRangeRaw: z.string().nullable().optional(),
  referenceRangeLow: z.number().nullable().optional(),
  referenceRangeHigh: z.number().nullable().optional(),
  flag: z.enum(['NORMAL', 'HIGH', 'LOW', 'CRITICAL_HIGH', 'CRITICAL_LOW', 'UNCLASSIFIED']).default('UNCLASSIFIED'),
  flagSource: z.enum(['source_reported', 'calculated', 'unspecified']).default('unspecified'),
  confidence: z.number().min(0).max(1).default(1.0),
  requiresReview: z.boolean().default(false),
  sourceText: z.string().nullable().optional(),
});

export type ExtractedObservation = z.infer<typeof ExtractedObservationSchema>;

export const ExtractedMedicationSchema = z.object({
  id: z.string().optional(),
  medicationName: z.string().min(1),
  dosage: z.string().nullable().optional(),
  frequency: z.string().nullable().optional(),
  duration: z.string().nullable().optional(),
  route: z.string().nullable().optional().default('Oral'),
  instructions: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  confidence: z.number().min(0).max(1).default(1.0),
  sourceText: z.string().nullable().optional(),
});

export type ExtractedMedication = z.infer<typeof ExtractedMedicationSchema>;

export const ExtractedDiagnosisSchema = z.object({
  id: z.string().optional(),
  conditionName: z.string().min(1),
  icd10Code: z.string().nullable().optional(),
  status: z.enum(['Active', 'Resolved', 'Suspected', 'Chronic', 'Unknown']).default('Active'),
  providerNotes: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1).default(1.0),
  sourceText: z.string().nullable().optional(),
});

export type ExtractedDiagnosis = z.infer<typeof ExtractedDiagnosisSchema>;

export const DocumentSummarySchema = z.object({
  id: z.string().optional(),
  summaryEn: z.string().min(10),
  summaryHi: z.string().nullable().optional(),
  keyFindings: z.array(z.string()).default([]),
  abnormalHighlights: z.array(z.string()).default([]),
  doctorQuestions: z.array(z.string()).default([]),
  modelUsed: z.string().default('gemini-2.5-flash'),
});

export type DocumentSummary = z.infer<typeof DocumentSummarySchema>;

export const MedicalExtractionPayloadSchema = z.object({
  documentType: z.enum(['Lab Report', 'Prescription', 'Diagnostic Report', 'Discharge Summary', 'Other']),
  documentDate: z.string().nullable().optional(), // YYYY-MM-DD
  providerName: z.string().nullable().optional(),
  patientName: z.string().nullable().optional(),
  patientAge: z.number().nullable().optional(),
  observations: z.array(ExtractedObservationSchema).default([]),
  medications: z.array(ExtractedMedicationSchema).default([]),
  diagnoses: z.array(ExtractedDiagnosisSchema).default([]),
  summaryEn: z.string().min(10),
  summaryHi: z.string().nullable().optional(),
  keyFindings: z.array(z.string()).default([]),
  abnormalHighlights: z.array(z.string()).default([]),
  doctorQuestions: z.array(z.string()).default([]),
});

export type MedicalExtractionPayload = z.infer<typeof MedicalExtractionPayloadSchema>;

export interface MedicalDocumentRecord {
  id: string;
  userId?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  filePath: string;
  fileHash: string;
  documentType: DocumentType;
  documentDate: string | null;
  uploadedAt: string;
  providerName: string | null;
  patientNameExtracted: string | null;
  patientAgeExtracted: number | null;
  rawExtractedText: string;
  extractionMethod: ExtractionMethod;
  processingStatus: ProcessingStatus;
  errorMessage?: string | null;
  observations: ExtractedObservation[];
  medications: ExtractedMedication[];
  diagnoses: ExtractedDiagnosis[];
  summary: DocumentSummary;
}

export interface PatientProfile {
  id: string;
  fullName: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  mockAbhaId: string; // Fictional/Mock ID clearly labelled
  allergies: string[];
  chronicConditions: string[];
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  metrics: {
    totalDocuments: number;
    abnormalObservationsCount: number;
    activeMedicationsCount: number;
    lastVisitDate: string | null;
  };
}
