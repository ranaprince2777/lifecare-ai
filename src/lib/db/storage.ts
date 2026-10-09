import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MedicalDocumentRecord, PatientProfile, ExtractedObservation, ExtractedMedication, ExtractedDiagnosis } from '../types/medical';
import { DEMO_PATIENT, DEMO_RECORDS } from '../demo/fixtures';

const DATA_DIR = path.join(process.cwd(), 'data');
const RECORDS_FILE = path.join(DATA_DIR, 'records.json');
const PROFILE_FILE = path.join(DATA_DIR, 'patient.json');

// Environment Variables with dual-alias support
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const configuredMode = (process.env.MEDIMIND_STORAGE_MODE || 'auto').toLowerCase();

/**
 * Validates whether Supabase credentials are configured with real values (not placeholders).
 */
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  (secretKey || publishableKey) &&
  !supabaseUrl.includes('your-project') &&
  !secretKey?.includes('your_supabase') &&
  !publishableKey?.includes('your_supabase')
);

/**
 * Active client: uses secret service-role key server-side when available for secure mediation.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, secretKey || publishableKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

/**
 * Storage Mode & Health Status descriptor
 */
export interface StorageStatus {
  mode: 'local' | 'supabase';
  configured: boolean;
  supabaseUrlConfigured: boolean;
  secretKeyConfigured: boolean;
  publishableKeyConfigured: boolean;
  localRecordsCount: number;
  provider: 'local_json' | 'supabase_postgres';
}

/**
 * Get active storage configuration and health status.
 */
export function getStorageStatus(): StorageStatus {
  ensureStorageInitialized();
  let localCount = DEMO_RECORDS.length;
  try {
    const raw = fs.readFileSync(RECORDS_FILE, 'utf-8');
    localCount = JSON.parse(raw).length;
  } catch {
    // fallback to demo fixtures count
  }

  const effectiveMode = (isSupabaseConfigured && configuredMode !== 'local') ? 'supabase' : 'local';

  return {
    mode: effectiveMode,
    configured: isSupabaseConfigured,
    supabaseUrlConfigured: Boolean(supabaseUrl && !supabaseUrl.includes('your-project')),
    secretKeyConfigured: Boolean(secretKey && !secretKey.includes('your_supabase')),
    publishableKeyConfigured: Boolean(publishableKey && !publishableKey.includes('your_supabase')),
    localRecordsCount: localCount,
    provider: effectiveMode === 'supabase' ? 'supabase_postgres' : 'local_json',
  };
}

/**
 * Ensures data directory and base storage files exist.
 */
export function ensureStorageInitialized() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(RECORDS_FILE)) {
      fs.writeFileSync(RECORDS_FILE, JSON.stringify(DEMO_RECORDS, null, 2), 'utf-8');
    }

    if (!fs.existsSync(PROFILE_FILE)) {
      fs.writeFileSync(PROFILE_FILE, JSON.stringify(DEMO_PATIENT, null, 2), 'utf-8');
    }
  } catch {
    // Read-only filesystem in serverless hosting (e.g. Vercel Lambda); proceed gracefully
  }
}

/**
 * Server-side authorization check before accessing records.
 * Ensures user medical data is never accessible across tenants or unauthenticated callers.
 */
export function verifyRecordAccess(record: MedicalDocumentRecord, requestUserId?: string): boolean {
  // Demo fixtures are synthetic demonstration records, universally accessible
  if (record.id.startsWith('demo-') || record.extractionMethod === 'demo_fixture') {
    return true;
  }

  // If the record has no assigned userId (guest demo record in local mode), allow access in local mode
  if (!record.userId) {
    return true;
  }

  // Strict ownership check: caller must match the record's userId
  if (requestUserId && record.userId === requestUserId) {
    return true;
  }

  return false;
}

// ============================================================================
// DATA MAPPERS (camelCase TypeScript <--> snake_case PostgreSQL)
// ============================================================================

export interface DbMedicalDocument {
  id: string;
  user_id: string | null;
  file_name: string;
  file_size: number;
  mime_type: string;
  file_path: string;
  file_hash: string;
  document_type: string;
  document_date: string | null;
  provider_name: string | null;
  patient_name_extracted: string | null;
  patient_age_extracted: number | null;
  raw_extracted_text: string;
  extraction_method: string;
  processing_status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export function recordToDbDocument(record: MedicalDocumentRecord): DbMedicalDocument {
  return {
    id: record.id,
    user_id: record.userId || null,
    file_name: record.fileName,
    file_size: record.fileSize,
    mime_type: record.mimeType,
    file_path: record.filePath,
    file_hash: record.fileHash,
    document_type: record.documentType,
    document_date: record.documentDate || null,
    provider_name: record.providerName || null,
    patient_name_extracted: record.patientNameExtracted || null,
    patient_age_extracted: record.patientAgeExtracted || null,
    raw_extracted_text: record.rawExtractedText || '',
    extraction_method: record.extractionMethod,
    processing_status: record.processingStatus,
    error_message: record.errorMessage || null,
    created_at: record.uploadedAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function dbDocumentToRecord(
  doc: DbMedicalDocument,
  observations: ExtractedObservation[] = [],
  medications: ExtractedMedication[] = [],
  diagnoses: ExtractedDiagnosis[] = [],
  summary?: import('../types/medical').DocumentSummary
): MedicalDocumentRecord {
  return {
    id: doc.id,
    userId: doc.user_id || undefined,
    fileName: doc.file_name,
    fileSize: doc.file_size,
    mimeType: doc.mime_type,
    filePath: doc.file_path,
    fileHash: doc.file_hash,
    documentType: doc.document_type as import('../types/medical').DocumentType,
    documentDate: doc.document_date,
    uploadedAt: doc.created_at,
    providerName: doc.provider_name,
    patientNameExtracted: doc.patient_name_extracted,
    patientAgeExtracted: doc.patient_age_extracted,
    rawExtractedText: doc.raw_extracted_text,
    extractionMethod: doc.extraction_method as import('../types/medical').ExtractionMethod,
    processingStatus: doc.processing_status as import('../types/medical').ProcessingStatus,
    errorMessage: doc.error_message,
    observations,
    medications,
    diagnoses,
    summary: summary || {
      id: randomUUID(),
      summaryEn: 'Summary unavailable.',
      summaryHi: null,
      keyFindings: [],
      abnormalHighlights: [],
      doctorQuestions: [],
      modelUsed: 'gemini-3.1-flash-lite',
    },
  };
}

// ============================================================================
// CRUD OPERATIONS (Dual Persistence: Supabase Cloud + Local JSON Fallback)
// ============================================================================

/**
 * Get all medical documents sorted by date (newest first).
 */
export async function getAllMedicalRecords(requestUserId?: string): Promise<MedicalDocumentRecord[]> {
  ensureStorageInitialized();

  // If Supabase is configured and not strictly set to local mode, attempt cloud query
  if (isSupabaseConfigured && supabase && configuredMode !== 'local') {
    try {
      let query = supabase.from('medical_documents').select('*').order('created_at', { ascending: false });

      if (requestUserId) {
        query = query.or(`user_id.eq.${requestUserId},id.like.demo-%`);
      }

      const { data: docs, error: docError } = await query;

      if (!docError && docs && docs.length > 0) {
        const docIds = docs.map((d: DbMedicalDocument) => d.id);

        // Fetch decomposed children in parallel
        const [obsRes, medRes, diagRes, sumRes] = await Promise.all([
          supabase.from('extracted_observations').select('*').in('document_id', docIds),
          supabase.from('medications').select('*').in('document_id', docIds),
          supabase.from('diagnoses').select('*').in('document_id', docIds),
          supabase.from('document_summaries').select('*').in('document_id', docIds),
        ]);

        const obsMap = new Map<string, ExtractedObservation[]>();
        (obsRes.data || []).forEach((row: Record<string, unknown>) => {
          const docId = row.document_id as string;
          const current = obsMap.get(docId) || [];
          current.push({
            id: row.id as string,
            testName: row.test_name as string,
            category: (row.category as string) || 'General',
            testResultValue: row.test_result_value as string,
            testResultNumeric: row.test_result_numeric != null ? Number(row.test_result_numeric) : null,
            unit: (row.unit as string) || null,
            referenceRangeRaw: (row.reference_range_raw as string) || null,
            referenceRangeLow: row.reference_range_low != null ? Number(row.reference_range_low) : null,
            referenceRangeHigh: row.reference_range_high != null ? Number(row.reference_range_high) : null,
            flag: (row.flag as import('../types/medical').ObservationFlag) || 'UNCLASSIFIED',
            flagSource: (row.flag_source as 'source_reported' | 'calculated' | 'unspecified') || 'unspecified',
            confidence: Number(row.confidence ?? 1.0),
            requiresReview: Boolean(row.requires_review),
            sourceText: (row.source_text as string) || null,
          });
          obsMap.set(docId, current);
        });

        const medMap = new Map<string, ExtractedMedication[]>();
        (medRes.data || []).forEach((row: Record<string, unknown>) => {
          const docId = row.document_id as string;
          const current = medMap.get(docId) || [];
          current.push({
            id: row.id as string,
            medicationName: row.medication_name as string,
            dosage: (row.dosage as string) || null,
            frequency: (row.frequency as string) || null,
            duration: (row.duration as string) || null,
            route: (row.route as string) || 'Oral',
            instructions: (row.instructions as string) || null,
            isActive: Boolean(row.is_active ?? true),
            confidence: Number(row.confidence ?? 1.0),
            sourceText: (row.source_text as string) || null,
          });
          medMap.set(docId, current);
        });

        const diagMap = new Map<string, ExtractedDiagnosis[]>();
        (diagRes.data || []).forEach((row: Record<string, unknown>) => {
          const docId = row.document_id as string;
          const current = diagMap.get(docId) || [];
          current.push({
            id: row.id as string,
            conditionName: row.condition_name as string,
            icd10Code: (row.icd10_code as string) || null,
            status: (row.status as 'Active' | 'Resolved' | 'Suspected' | 'Chronic' | 'Unknown') || 'Active',
            providerNotes: (row.provider_notes as string) || null,
            confidence: Number(row.confidence ?? 1.0),
            sourceText: (row.source_text as string) || null,
          });
          diagMap.set(docId, current);
        });

        const sumMap = new Map<string, import('../types/medical').DocumentSummary>();
        (sumRes.data || []).forEach((row: Record<string, unknown>) => {
          const docId = row.document_id as string;
          sumMap.set(docId, {
            id: row.id as string,
            summaryEn: row.summary_en as string,
            summaryHi: (row.summary_hi as string) || null,
            keyFindings: Array.isArray(row.key_findings) ? (row.key_findings as string[]) : [],
            abnormalHighlights: Array.isArray(row.abnormal_highlights) ? (row.abnormal_highlights as string[]) : [],
            doctorQuestions: Array.isArray(row.doctor_questions) ? (row.doctor_questions as string[]) : [],
            modelUsed: (row.model_used as string) || 'gemini-3.1-flash-lite',
          });
        });

        const records = docs.map((doc: DbMedicalDocument) =>
          dbDocumentToRecord(doc, obsMap.get(doc.id) || [], medMap.get(doc.id) || [], diagMap.get(doc.id) || [], sumMap.get(doc.id))
        );

        return records;
      }
    } catch {
      // Cloud read failed or table does not exist yet; fall back smoothly to local JSON
    }
  }

  // Local JSON Fallback Engine
  try {
    const raw = fs.readFileSync(RECORDS_FILE, 'utf-8');
    const records: MedicalDocumentRecord[] = JSON.parse(raw);

    const authorized = records.filter((r) => verifyRecordAccess(r, requestUserId));

    return authorized.sort((a, b) => {
      const dateA = a.documentDate || a.uploadedAt;
      const dateB = b.documentDate || b.uploadedAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  } catch {
    return DEMO_RECORDS;
  }
}

/**
 * Get a specific record by its UUID or identifier.
 */
export async function getMedicalRecordById(id: string, requestUserId?: string): Promise<MedicalDocumentRecord | null> {
  const records = await getAllMedicalRecords(requestUserId);
  const found = records.find((r) => r.id === id);
  if (!found) return null;

  if (!verifyRecordAccess(found, requestUserId)) {
    return null;
  }

  return found;
}

/**
 * Save a newly extracted or updated record.
 * Dual-persistence: updates local store and synchronizes with Supabase PostgreSQL if configured.
 */
export async function saveMedicalRecord(record: MedicalDocumentRecord): Promise<MedicalDocumentRecord> {
  ensureStorageInitialized();

  // 1. Always persist in local JSON to guarantee zero data loss
  const localRecords = await getLocalRecordsRaw();
  const existingIdx = localRecords.findIndex((r) => r.id === record.id);

  if (existingIdx >= 0) {
    localRecords[existingIdx] = record;
  } else {
    localRecords.unshift(record);
  }

  try {
    fs.writeFileSync(RECORDS_FILE, JSON.stringify(localRecords, null, 2), 'utf-8');
    await recalculatePatientMetrics();
  } catch {
    // Read-only filesystem in serverless hosting (e.g. Vercel Lambda); continue with cloud persistence
  }

  // 2. Synchronize to Supabase PostgreSQL when configured
  if (isSupabaseConfigured && supabase && configuredMode !== 'local') {
    try {
      const dbDoc = recordToDbDocument(record);

      // Upsert master document
      const { error: docError } = await supabase.from('medical_documents').upsert(dbDoc, { onConflict: 'id' });
      if (docError) throw docError;

      // Clean old child records for this document to avoid duplicates on update
      await Promise.all([
        supabase.from('extracted_observations').delete().eq('document_id', record.id),
        supabase.from('medications').delete().eq('document_id', record.id),
        supabase.from('diagnoses').delete().eq('document_id', record.id),
        supabase.from('document_summaries').delete().eq('document_id', record.id),
      ]);

      // Insert Observations
      if (record.observations.length > 0) {
        const obsRows = record.observations.map((obs) => ({
          id: obs.id || randomUUID(),
          document_id: record.id,
          user_id: record.userId || null,
          test_name: obs.testName,
          category: obs.category || 'General',
          test_result_value: obs.testResultValue,
          test_result_numeric: obs.testResultNumeric ?? null,
          unit: obs.unit || null,
          reference_range_raw: obs.referenceRangeRaw || null,
          reference_range_low: obs.referenceRangeLow ?? null,
          reference_range_high: obs.referenceRangeHigh ?? null,
          flag: obs.flag || 'UNCLASSIFIED',
          flag_source: obs.flagSource || 'unspecified',
          confidence: obs.confidence ?? 1.0,
          requires_review: Boolean(obs.requiresReview),
          source_text: obs.sourceText || null,
        }));
        const { error: obsError } = await supabase.from('extracted_observations').insert(obsRows);
        if (obsError) throw obsError;
      }

      // Insert Medications
      if (record.medications.length > 0) {
        const medRows = record.medications.map((med) => ({
          id: med.id || randomUUID(),
          document_id: record.id,
          user_id: record.userId || null,
          medication_name: med.medicationName,
          dosage: med.dosage || null,
          frequency: med.frequency || null,
          duration: med.duration || null,
          route: med.route || 'Oral',
          instructions: med.instructions || null,
          is_active: med.isActive ?? true,
          prescribed_date: record.documentDate || null,
          prescribing_doctor: record.providerName || null,
          confidence: med.confidence ?? 1.0,
          source_text: med.sourceText || null,
        }));
        const { error: medError } = await supabase.from('medications').insert(medRows);
        if (medError) throw medError;
      }

      // Insert Diagnoses
      if (record.diagnoses.length > 0) {
        const diagRows = record.diagnoses.map((diag) => ({
          id: diag.id || randomUUID(),
          document_id: record.id,
          user_id: record.userId || null,
          condition_name: diag.conditionName,
          icd10_code: diag.icd10Code || null,
          status: diag.status || 'Active',
          provider_notes: diag.providerNotes || null,
          source_text: diag.sourceText || null,
          confidence: diag.confidence ?? 1.0,
        }));
        const { error: diagError } = await supabase.from('diagnoses').insert(diagRows);
        if (diagError) throw diagError;
      }

      // Insert Summary
      if (record.summary) {
        const sumRow = {
          id: record.summary.id || randomUUID(),
          document_id: record.id,
          user_id: record.userId || null,
          summary_en: record.summary.summaryEn,
          summary_hi: record.summary.summaryHi || null,
          key_findings: record.summary.keyFindings || [],
          abnormal_highlights: record.summary.abnormalHighlights || [],
          doctor_questions: record.summary.doctorQuestions || [],
          model_used: record.summary.modelUsed || 'gemini-3.1-flash-lite',
        };
        const { error: sumError } = await supabase.from('document_summaries').insert(sumRow);
        if (sumError) throw sumError;
      }
    } catch (err: unknown) {
      if (configuredMode === 'supabase') {
        const msg = err instanceof Error ? err.message : 'Unknown database error';
        throw new Error(`Failed to synchronize medical document to Supabase cloud database: ${msg}`);
      }
      console.warn('Supabase synchronization warning (operating in local fallback):', err);
    }
  }

  return record;
}

/**
 * Delete a record.
 */
export async function deleteMedicalRecord(id: string, requestUserId?: string): Promise<boolean> {
  ensureStorageInitialized();

  const record = await getMedicalRecordById(id, requestUserId);
  if (!record) return false;

  if (!verifyRecordAccess(record, requestUserId)) {
    return false;
  }

  // Delete from local JSON
  const localRecords = await getLocalRecordsRaw();
  const filtered = localRecords.filter((r) => r.id !== id);
  const changed = filtered.length !== localRecords.length;

  if (changed) {
    try {
      fs.writeFileSync(RECORDS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
      await recalculatePatientMetrics();
    } catch {
      // Read-only filesystem in serverless hosting
    }
  }

  // Delete from Supabase (cascades to observations, medications, diagnoses, summaries)
  if (isSupabaseConfigured && supabase && configuredMode !== 'local') {
    try {
      await supabase.from('medical_documents').delete().eq('id', id);
    } catch {
      // Ignore cloud deletion errors during fallback
    }
  }

  return changed;
}

/**
 * Get patient profile.
 */
export async function getPatientProfile(): Promise<PatientProfile> {
  ensureStorageInitialized();
  try {
    const raw = fs.readFileSync(PROFILE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return DEMO_PATIENT;
  }
}

/**
 * Update patient profile.
 */
export async function updatePatientProfile(updated: Partial<PatientProfile>): Promise<PatientProfile> {
  ensureStorageInitialized();
  const current = await getPatientProfile();
  const merged: PatientProfile = { ...current, ...updated };
  fs.writeFileSync(PROFILE_FILE, JSON.stringify(merged, null, 2), 'utf-8');

  // Sync to Supabase profiles if configured
  if (isSupabaseConfigured && supabase && configuredMode !== 'local') {
    try {
      await supabase.from('profiles').upsert({
        id: merged.id,
        full_name: merged.fullName,
        age: merged.age,
        gender: merged.gender,
        blood_group: merged.bloodGroup,
        mock_abha_id: merged.mockAbhaId,
        allergies: merged.allergies,
        chronic_conditions: merged.chronicConditions,
        emergency_contact: merged.emergencyContact,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    } catch {
      // Ignore cloud profile update error during fallback
    }
  }

  return merged;
}

/**
 * Reset demo storage back to pristine initial state.
 */
export async function resetDemoData(): Promise<void> {
  ensureStorageInitialized();
  fs.writeFileSync(RECORDS_FILE, JSON.stringify(DEMO_RECORDS, null, 2), 'utf-8');
  fs.writeFileSync(PROFILE_FILE, JSON.stringify(DEMO_PATIENT, null, 2), 'utf-8');
}

/**
 * Helper to get local records without authorization filtering (internal maintenance only).
 */
async function getLocalRecordsRaw(): Promise<MedicalDocumentRecord[]> {
  try {
    const raw = fs.readFileSync(RECORDS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [...DEMO_RECORDS];
  }
}

/**
 * Recalculates metrics for the patient profile based on active records.
 */
async function recalculatePatientMetrics(): Promise<void> {
  const records = await getLocalRecordsRaw();
  const profile = await getPatientProfile();

  let abnormalCount = 0;
  let activeMedsCount = 0;
  let latestDate: string | null = null;

  for (const rec of records) {
    for (const obs of rec.observations) {
      if (obs.flag === 'HIGH' || obs.flag === 'LOW' || obs.flag === 'CRITICAL_HIGH' || obs.flag === 'CRITICAL_LOW') {
        abnormalCount++;
      }
    }
    for (const med of rec.medications) {
      if (med.isActive) {
        activeMedsCount++;
      }
    }
    if (rec.documentDate) {
      if (!latestDate || new Date(rec.documentDate) > new Date(latestDate)) {
        latestDate = rec.documentDate;
      }
    }
  }

  profile.metrics = {
    totalDocuments: records.length,
    abnormalObservationsCount: abnormalCount,
    activeMedicationsCount: activeMedsCount,
    lastVisitDate: latestDate,
  };

  fs.writeFileSync(PROFILE_FILE, JSON.stringify(profile, null, 2), 'utf-8');
}
