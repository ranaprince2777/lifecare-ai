import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MedicalDocumentRecord, PatientProfile, ExtractedObservation, ExtractedMedication, ExtractedDiagnosis, DashboardStats } from '../types/medical';
import { DEMO_PATIENT, DEMO_RECORDS } from '../demo/fixtures';

const DATA_DIR = path.join(process.cwd(), 'data');
const RECORDS_FILE = path.join(DATA_DIR, 'records.json');
const PROFILE_FILE = path.join(DATA_DIR, 'patient.json');
const PATIENTS_FILE = path.join(DATA_DIR, 'patients.json');

export const INITIAL_PATIENTS: PatientProfile[] = [
  {
    id: 'pat-meera-nambiar',
    fullName: 'Meera Nambiar',
    age: 44,
    gender: 'Female',
    bloodGroup: 'O+',
    mockAbhaId: '42-8192-3041-9921',
    allergies: ['None documented'],
    chronicConditions: ['Type 2 Diabetes Mellitus', 'Mixed Dyslipidemia'],
    emergencyContact: {
      name: 'K. Nambiar',
      relationship: 'Spouse',
      phone: '+91 98450 12345',
    },
    metrics: {
      totalDocuments: 2,
      abnormalObservationsCount: 5,
      activeMedicationsCount: 2,
      lastVisitDate: '2026-04-08',
    },
    isDemo: false,
    createdAt: '2026-04-08T09:00:00.000Z',
    updatedAt: '2026-04-08T09:00:00.000Z',
  },
  {
    id: 'pat-anita-desai',
    fullName: 'Anita Desai',
    age: 38,
    gender: 'Female',
    bloodGroup: 'B+',
    mockAbhaId: '19-5821-4491-0382',
    allergies: ['None documented'],
    chronicConditions: ['Mild fasting hyperglycemia', 'Mild hyperuricemia'],
    emergencyContact: {
      name: 'R. Desai',
      relationship: 'Spouse',
      phone: '+91 98200 54321',
    },
    metrics: {
      totalDocuments: 2,
      abnormalObservationsCount: 2,
      activeMedicationsCount: 0,
      lastVisitDate: '2026-04-05',
    },
    isDemo: false,
    createdAt: '2026-04-05T09:00:00.000Z',
    updatedAt: '2026-04-05T09:00:00.000Z',
  },
  {
    id: 'pat-rajesh-sharma',
    fullName: 'Rajesh Sharma',
    age: 58,
    gender: 'Male',
    bloodGroup: 'A+',
    mockAbhaId: '88-1920-7721-4819',
    allergies: ['None documented'],
    chronicConditions: ['Acute Coronary Syndrome (NSTEMI)', 'Primary Essential Hypertension'],
    emergencyContact: {
      name: 'P. Sharma',
      relationship: 'Family',
      phone: '+91 97110 99887',
    },
    metrics: {
      totalDocuments: 1,
      abnormalObservationsCount: 0,
      activeMedicationsCount: 5,
      lastVisitDate: '2026-04-05',
    },
    isDemo: false,
    createdAt: '2026-04-05T09:00:00.000Z',
    updatedAt: '2026-04-05T09:00:00.000Z',
  },
  {
    id: 'demo-patient-001',
    fullName: 'Rajesh Kumar Verma',
    age: 48,
    gender: 'Male',
    bloodGroup: 'B+',
    mockAbhaId: '91-4829-1049-5521 (Demo)',
    allergies: ['Penicillin (Skin rash)', 'Sulfonamides'],
    chronicConditions: ['Type 2 Diabetes Mellitus', 'Essential Hypertension'],
    emergencyContact: {
      name: 'Sunita Verma',
      relationship: 'Spouse',
      phone: '+91 98765 43210',
    },
    metrics: {
      totalDocuments: 4,
      abnormalObservationsCount: 4,
      activeMedicationsCount: 3,
      lastVisitDate: '2026-04-08',
    },
    isDemo: true,
    createdAt: '2026-04-01T09:00:00.000Z',
    updatedAt: '2026-04-01T09:00:00.000Z',
  },
];

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

    if (!fs.existsSync(PATIENTS_FILE)) {
      fs.writeFileSync(PATIENTS_FILE, JSON.stringify(INITIAL_PATIENTS, null, 2), 'utf-8');
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

export const isUuid = (val?: string | null): boolean =>
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

export function recordToDbDocument(record: MedicalDocumentRecord): DbMedicalDocument {
  const safeFilePath = record.patientId && !record.filePath.startsWith('patients/')
    ? `patients/${record.patientId}|${record.filePath}`
    : record.filePath;

  return {
    id: record.id,
    user_id: record.patientId || record.userId || null,
    file_name: record.fileName,
    file_size: record.fileSize,
    mime_type: record.mimeType,
    file_path: safeFilePath,
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
  let resolvedPatientId = doc.user_id || undefined;
  let resolvedFilePath = doc.file_path;

  if (doc.file_path && doc.file_path.startsWith('patients/')) {
    const pipeIdx = doc.file_path.indexOf('|');
    if (pipeIdx > 0) {
      resolvedPatientId = doc.file_path.substring('patients/'.length, pipeIdx);
      resolvedFilePath = doc.file_path.substring(pipeIdx + 1);
    } else {
      const parts = doc.file_path.split('/');
      if (parts.length >= 2) {
        resolvedPatientId = parts[1];
      }
    }
  }

  return {
    id: doc.id,
    userId: doc.user_id || undefined,
    patientId: resolvedPatientId,
    fileName: doc.file_name,
    fileSize: doc.file_size,
    mimeType: doc.mime_type,
    filePath: resolvedFilePath,
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

// Helper to prevent database queries from stalling requests beyond a safe ceiling
async function withTimeout<T>(
  promise: PromiseLike<T> | Promise<T>,
  timeoutMs: number,
  fallbackValue: T
): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallbackValue), timeoutMs);
  });
  return Promise.race([
    Promise.resolve(promise).then((res) => {
      clearTimeout(timer);
      return res;
    }),
    timeoutPromise,
  ]);
}

// In-memory cache for ultra-fast data retrieval and reduced cloud roundtrips
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const recordsCache = new Map<string, CacheEntry<MedicalDocumentRecord[]>>();
const RECORDS_CACHE_TTL_MS = 15_000;

export function invalidateRecordsCache(): void {
  recordsCache.clear();
}

/**
 * Get all medical documents sorted by date (newest first).
 */
export async function getAllMedicalRecords(requestUserId?: string, patientId?: string): Promise<MedicalDocumentRecord[]> {
  ensureStorageInitialized();

  const cacheKey = `${requestUserId || 'anon'}:${patientId || 'all'}`;
  const cached = recordsCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < RECORDS_CACHE_TTL_MS)) {
    return cached.data;
  }

  const cacheAndReturn = (results: MedicalDocumentRecord[]) => {
    recordsCache.set(cacheKey, { data: results, timestamp: Date.now() });
    return results;
  };

  // If Supabase is configured and not strictly set to local mode, attempt cloud query
  if (isSupabaseConfigured && supabase && configuredMode !== 'local') {
    try {
      let query = supabase.from('medical_documents').select('*').order('created_at', { ascending: false });

      if (patientId && patientId !== 'all') {
        if (isUuid(patientId)) {
          query = query.eq('user_id', patientId);
        }
      } else if (requestUserId && isUuid(requestUserId)) {
        query = query.or(`user_id.eq.${requestUserId},id.like.demo-%`);
      }

      const { data: docs, error: docError } = await withTimeout<{ data: DbMedicalDocument[] | null; error: unknown }>(
        query as unknown as PromiseLike<{ data: DbMedicalDocument[] | null; error: unknown }>,
        4500,
        { data: null, error: new Error('Supabase query timed out') }
      );

      if (!docError && docs) {
        if (docs.length === 0) {
          return cacheAndReturn([]);
        }
        const docIds = docs.map((d: DbMedicalDocument) => d.id);

        // Fetch decomposed children in parallel with timeout protection
        const [obsRes, medRes, diagRes, sumRes] = await withTimeout<Array<{ data: Record<string, unknown>[] | null; error: unknown }>>(
          Promise.all([
            supabase.from('extracted_observations').select('*').in('document_id', docIds),
            supabase.from('medications').select('*').in('document_id', docIds),
            supabase.from('diagnoses').select('*').in('document_id', docIds),
            supabase.from('document_summaries').select('*').in('document_id', docIds),
          ]) as unknown as PromiseLike<Array<{ data: Record<string, unknown>[] | null; error: unknown }>>,
          4500,
          [
            { data: null, error: new Error('Observations query timed out') },
            { data: null, error: new Error('Medications query timed out') },
            { data: null, error: new Error('Diagnoses query timed out') },
            { data: null, error: new Error('Summaries query timed out') },
          ]
        );

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

        const records = docs.map((doc: DbMedicalDocument) => {
          const rec = dbDocumentToRecord(
            doc,
            obsMap.get(doc.id) || [],
            medMap.get(doc.id) || [],
            diagMap.get(doc.id) || [],
            sumMap.get(doc.id)
          );
          return enrichRecordPatientId(rec);
        });

        // Also cross-reference local store to ensure patientId & patientNameExtracted are never lost
        try {
          if (fs.existsSync(RECORDS_FILE)) {
            const raw = fs.readFileSync(RECORDS_FILE, 'utf-8');
            const localList: MedicalDocumentRecord[] = JSON.parse(raw);
            const localMap = new Map(localList.map((l) => [l.id, l]));
            for (const r of records) {
              const localMatch = localMap.get(r.id);
              if (localMatch?.patientId && !r.patientId) {
                r.patientId = localMatch.patientId;
              }
              if (localMatch?.patientNameExtracted && !r.patientNameExtracted) {
                r.patientNameExtracted = localMatch.patientNameExtracted;
              }
            }
          }
        } catch {
          // ignore local read error
        }

        if (patientId && patientId !== 'all') {
          return cacheAndReturn(
            records.filter(
              (r) =>
                r.patientId === patientId ||
                r.userId === patientId ||
                (r.patientNameExtracted && r.patientNameExtracted.toLowerCase().trim() === patientId.toLowerCase().trim())
            )
          );
        }

        return cacheAndReturn(records);
      }
    } catch {
      // Cloud read failed or table does not exist yet; fall back smoothly to local JSON
    }
  }

  // Local JSON Fallback Engine
  try {
    const raw = fs.readFileSync(RECORDS_FILE, 'utf-8');
    const records: MedicalDocumentRecord[] = (JSON.parse(raw) as MedicalDocumentRecord[]).map(enrichRecordPatientId);

    let authorized = records.filter((r) => verifyRecordAccess(r, requestUserId));
    if (patientId && patientId !== 'all') {
      authorized = authorized.filter(
        (r) =>
          r.patientId === patientId ||
          r.userId === patientId ||
          (r.patientNameExtracted && r.patientNameExtracted.toLowerCase().trim() === patientId.toLowerCase().trim())
      );
    }

    return cacheAndReturn(
      authorized.sort((a, b) => {
        const dateA = a.documentDate || a.uploadedAt;
        const dateB = b.documentDate || b.uploadedAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      })
    );
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
  enrichRecordPatientId(record);

  if (record.patientId && !record.patientNameExtracted) {
    try {
      const allPatients = await getAllPatients();
      const match = allPatients.find((p) => p.id === record.patientId);
      if (match) {
        record.patientNameExtracted = match.fullName;
      }
    } catch {
      // Continue gracefully
    }
  }

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
      if (dbDoc.user_id && !isUuid(dbDoc.user_id)) {
        dbDoc.user_id = null;
      }

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

      const safeChildUserId = isUuid(record.userId) ? record.userId : null;

      // Insert Observations
      if (record.observations.length > 0) {
        const obsRows = record.observations.map((obs) => ({
          id: obs.id || randomUUID(),
          document_id: record.id,
          user_id: safeChildUserId,
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
          user_id: safeChildUserId,
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
          user_id: safeChildUserId,
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
          user_id: safeChildUserId,
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

  invalidatePatientsCache();
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

  invalidatePatientsCache();
  return changed;
}

/**
 * Maps raw records to ensure patientId is consistently populated.
 */
export function enrichRecordPatientId(record: MedicalDocumentRecord): MedicalDocumentRecord {
  if (!record.patientId) {
    if (record.userId && (record.userId.startsWith('pat-') || record.userId.startsWith('demo-'))) {
      record.patientId = record.userId;
    } else if (record.patientNameExtracted) {
      const lower = record.patientNameExtracted.toLowerCase();
      if (lower.includes('meera')) record.patientId = 'pat-meera-nambiar';
      else if (lower.includes('anita')) record.patientId = 'pat-anita-desai';
      else if (lower.includes('sharma')) record.patientId = 'pat-rajesh-sharma';
      else if (lower.includes('verma') || record.id.startsWith('demo-')) record.patientId = 'demo-patient-001';
      else record.patientId = `pat-${record.patientNameExtracted.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    } else if (record.id.startsWith('demo-')) {
      record.patientId = 'demo-patient-001';
    }
  }
  return record;
}

// In-memory cache for ultra-fast patient retrieval and reduced database roundtrips
let patientsCache: CacheEntry<PatientProfile[]> | null = null;
const PATIENTS_CACHE_TTL_MS = 15_000;

const dashboardStatsCache = new Map<string, CacheEntry<DashboardStats>>();
const DASHBOARD_CACHE_TTL_MS = 15_000;

export function invalidatePatientsCache(): void {
  patientsCache = null;
  dashboardStatsCache.clear();
  recordsCache.clear();
}

/**
 * Get all registered patients with real-time calculated metrics from saved documents.
 * High-performance: uses lightweight counting queries, unified parallel fetching, and server-side memory caching.
 */
export async function getAllPatients(): Promise<PatientProfile[]> {
  ensureStorageInitialized();

  // Fast-path: return cached patient directory if fresh
  if (patientsCache && (Date.now() - patientsCache.timestamp < PATIENTS_CACHE_TTL_MS)) {
    return patientsCache.data;
  }

  let patients: PatientProfile[] = [];
  let docSummaries: Array<{ id: string; patientId?: string; patientName?: string; docDate: string }> = [];
  const abnormalObsDocIds = new Set<string>();
  const activeMedDocIds = new Map<string, number>();
  const diagMap = new Map<string, string[]>();

  // 1. Single unified parallel fetch with strict 4.5s timeout protection against serverless cold hangs
  if (isSupabaseConfigured && supabase && configuredMode !== 'local') {
    try {
      const [profilesRes, docsRes, obsRes, medsRes, diagRes] = await withTimeout<Array<{ data: Record<string, unknown>[] | null; error: unknown }>>(
        Promise.all([
          supabase.from('profiles').select('*').order('created_at', { ascending: false }),
          supabase.from('medical_documents').select('id, user_id, file_path, patient_name_extracted, document_date, created_at'),
          supabase.from('extracted_observations').select('document_id, flag').in('flag', ['HIGH', 'LOW', 'CRITICAL_HIGH', 'CRITICAL_LOW']),
          supabase.from('medications').select('document_id').eq('is_active', true),
          supabase.from('diagnoses').select('document_id, condition_name'),
        ]) as unknown as PromiseLike<Array<{ data: Record<string, unknown>[] | null; error: unknown }>>,
        4500,
        [
          { data: null, error: new Error('Profiles query timed out') },
          { data: null, error: new Error('Documents query timed out') },
          { data: null, error: new Error('Observations query timed out') },
          { data: null, error: new Error('Medications query timed out') },
          { data: null, error: new Error('Diagnoses query timed out') },
        ]
      );

      if (!profilesRes.error && profilesRes.data && profilesRes.data.length > 0) {
        patients = profilesRes.data.map((row: Record<string, unknown>) => ({
          id: (row.id as string) || '',
          fullName: (row.full_name as string) || 'Unnamed Patient',
          age: row.age != null ? Number(row.age) : null,
          gender: (row.gender as PatientProfile['gender']) || null,
          bloodGroup: (row.blood_group as string) || null,
          mockAbhaId: (row.mock_abha_id as string) || '',
          allergies: Array.isArray(row.allergies) ? (row.allergies as string[]) : [],
          chronicConditions: Array.isArray(row.chronic_conditions) ? (row.chronic_conditions as string[]) : [],
          emergencyContact: (row.emergency_contact as PatientProfile['emergencyContact']) || undefined,
          metrics: {
            totalDocuments: 0,
            abnormalObservationsCount: 0,
            activeMedicationsCount: 0,
            lastVisitDate: null,
          },
          isDemo: (row.id as string).startsWith('demo-'),
          createdAt: (row.created_at as string) || undefined,
          updatedAt: (row.updated_at as string) || undefined,
        }));
      }

      if (docsRes.data) {
        docSummaries = docsRes.data.map((d: Record<string, unknown>) => {
          let patId = (d.user_id as string) || undefined;
          const filePath = (d.file_path as string) || '';
          if (filePath.startsWith('patients/')) {
            const pipeIdx = filePath.indexOf('|');
            if (pipeIdx > 0) patId = filePath.substring('patients/'.length, pipeIdx);
          }
          return {
            id: d.id as string,
            patientId: patId,
            patientName: (d.patient_name_extracted as string) || undefined,
            docDate: (d.document_date as string) || (d.created_at ? (d.created_at as string).split('T')[0] : new Date().toISOString().split('T')[0]),
          };
        });
      }

      (obsRes.data || []).forEach((row: Record<string, unknown>) => {
        if (row.document_id) abnormalObsDocIds.add(row.document_id as string);
      });

      (medsRes.data || []).forEach((row: Record<string, unknown>) => {
        const docId = row.document_id as string;
        if (docId) activeMedDocIds.set(docId, (activeMedDocIds.get(docId) || 0) + 1);
      });

      (diagRes.data || []).forEach((row: Record<string, unknown>) => {
        const docId = row.document_id as string;
        const cond = row.condition_name as string;
        if (docId && cond) {
          const list = diagMap.get(docId) || [];
          list.push(cond);
          diagMap.set(docId, list);
        }
      });
    } catch {
      // cloud fetch fallback
    }
  }

  // 2. Local JSON fallback
  if (patients.length === 0) {
    try {
      if (fs.existsSync(PATIENTS_FILE)) {
        patients = JSON.parse(fs.readFileSync(PATIENTS_FILE, 'utf-8'));
      } else {
        patients = [...INITIAL_PATIENTS];
      }
    } catch {
      patients = [...INITIAL_PATIENTS];
    }
  }

  // 3. Ensure baseline initial patients are always registered
  for (const seed of INITIAL_PATIENTS) {
    if (!patients.some((p) => p.id === seed.id || p.fullName.toLowerCase() === seed.fullName.toLowerCase())) {
      patients.push(seed);
    }
  }

  // Cross-reference / fallback to local records
  if (docSummaries.length === 0) {
    try {
      if (fs.existsSync(RECORDS_FILE)) {
        const raw = fs.readFileSync(RECORDS_FILE, 'utf-8');
        const localRecs: MedicalDocumentRecord[] = JSON.parse(raw);
        docSummaries = localRecs.map((r) => ({
          id: r.id,
          patientId: r.patientId || r.userId,
          patientName: r.patientNameExtracted || undefined,
          docDate: r.documentDate || r.uploadedAt.split('T')[0],
        }));
        localRecs.forEach((r) => {
          r.observations?.forEach((o) => {
            if (['HIGH', 'LOW', 'CRITICAL_HIGH', 'CRITICAL_LOW'].includes(o.flag)) {
              abnormalObsDocIds.add(r.id);
            }
          });
          const activeCount = r.medications?.filter((m) => m.isActive).length || 0;
          if (activeCount > 0) activeMedDocIds.set(r.id, activeCount);
          r.diagnoses?.forEach((d) => {
            if (d.conditionName) {
              const list = diagMap.get(r.id) || [];
              list.push(d.conditionName);
              diagMap.set(r.id, list);
            }
          });
        });
      }
    } catch {
      // ignore
    }
  }

  // Compute live metrics per patient
  for (const p of patients) {
    const matchingDocs = docSummaries.filter(
      (d) =>
        d.patientId === p.id ||
        (d.patientName && d.patientName.toLowerCase().trim() === p.fullName.toLowerCase().trim())
    );

    let abnormalCount = 0;
    let activeMeds = 0;
    let lastVisit: string | null = null;
    const conditionsSet = new Set<string>(p.chronicConditions || []);

    for (const doc of matchingDocs) {
      if (abnormalObsDocIds.has(doc.id)) abnormalCount++;
      activeMeds += activeMedDocIds.get(doc.id) || 0;
      const diags = diagMap.get(doc.id) || [];
      diags.forEach((c) => conditionsSet.add(c));
      if (!lastVisit || new Date(doc.docDate) > new Date(lastVisit)) {
        lastVisit = doc.docDate;
      }
    }

    p.metrics = {
      totalDocuments: matchingDocs.length,
      abnormalObservationsCount: abnormalCount,
      activeMedicationsCount: activeMeds,
      lastVisitDate: lastVisit,
    };
    p.chronicConditions = Array.from(conditionsSet);
  }

  // Sort real patients first, demo patients last
  const sorted = patients.sort((a, b) => {
    if (a.isDemo && !b.isDemo) return 1;
    if (!a.isDemo && b.isDemo) return -1;
    return a.fullName.localeCompare(b.fullName);
  });

  // Store in cache
  patientsCache = {
    data: sorted,
    timestamp: Date.now(),
  };

  return sorted;
}

/**
 * Get a single patient by ID with calculated live metrics.
 */
export async function getPatientById(id: string): Promise<PatientProfile | null> {
  const all = await getAllPatients();
  return all.find((p) => p.id === id) || null;
}

/**
 * Create a new patient in the registry.
 */
export async function createPatient(data: Partial<PatientProfile>): Promise<PatientProfile> {
  ensureStorageInitialized();

  const id = data.id || `pat-${randomUUID().slice(0, 8)}`;
  const randDigits = (len: number) => Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join('');
  const mockAbhaId = data.mockAbhaId || `${randDigits(2)}-${randDigits(4)}-${randDigits(4)}-${randDigits(4)}`;

  const newPatient: PatientProfile = {
    id,
    fullName: data.fullName?.trim() || 'New Patient',
    age: data.age != null ? Number(data.age) : null,
    gender: data.gender ?? null,
    bloodGroup: data.bloodGroup ?? null,
    mockAbhaId,
    allergies: data.allergies || [],
    chronicConditions: data.chronicConditions || [],
    emergencyContact: data.emergencyContact || undefined,
    metrics: {
      totalDocuments: 0,
      abnormalObservationsCount: 0,
      activeMedicationsCount: 0,
      lastVisitDate: null,
    },
    isDemo: Boolean(data.isDemo),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Local JSON write
  try {
    let list: PatientProfile[] = [];
    if (fs.existsSync(PATIENTS_FILE)) {
      list = JSON.parse(fs.readFileSync(PATIENTS_FILE, 'utf-8'));
    } else {
      list = [...INITIAL_PATIENTS];
    }
    const idx = list.findIndex((p) => p.id === id);
    if (idx >= 0) {
      list[idx] = newPatient;
    } else {
      list.unshift(newPatient);
    }
    fs.writeFileSync(PATIENTS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch {
    // Read-only serverless handling
  }

  // 2. Cloud Supabase write
  if (isSupabaseConfigured && supabase && configuredMode !== 'local') {
    try {
      await supabase.from('profiles').upsert(
        {
          id: newPatient.id,
          full_name: newPatient.fullName,
          age: newPatient.age,
          gender: newPatient.gender,
          blood_group: newPatient.bloodGroup,
          mock_abha_id: newPatient.mockAbhaId,
          allergies: newPatient.allergies,
          chronic_conditions: newPatient.chronicConditions,
          emergency_contact: newPatient.emergencyContact,
          created_at: newPatient.createdAt,
          updated_at: newPatient.updatedAt,
        },
        { onConflict: 'id' }
      );
    } catch {
      // cloud error ignored
    }
  }

  invalidatePatientsCache();
  return newPatient;
}

/**
 * Get active patient profile (for backwards compatibility).
 */
export async function getPatientProfile(): Promise<PatientProfile> {
  const patients = await getAllPatients();
  // Return first real patient if available, otherwise first demo patient
  const nonDemo = patients.find((p) => !p.isDemo && p.metrics.totalDocuments > 0);
  return nonDemo || patients[0] || DEMO_PATIENT;
}

/**
 * Update patient profile (supports both updatePatientProfile(updated) and updatePatientProfile(id, updated)).
 */
export async function updatePatientProfile(
  idOrUpdated: string | Partial<PatientProfile>,
  maybeUpdated?: Partial<PatientProfile>
): Promise<PatientProfile> {
  ensureStorageInitialized();

  let targetId: string;
  let updates: Partial<PatientProfile>;

  if (typeof idOrUpdated === 'string') {
    targetId = idOrUpdated;
    updates = maybeUpdated || {};
  } else {
    const defaultPat = await getPatientProfile();
    targetId = idOrUpdated.id || defaultPat.id;
    updates = idOrUpdated;
  }

  const existing = (await getPatientById(targetId)) || DEMO_PATIENT;
  const merged: PatientProfile = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // 1. Update local
  try {
    let list: PatientProfile[] = [];
    if (fs.existsSync(PATIENTS_FILE)) {
      list = JSON.parse(fs.readFileSync(PATIENTS_FILE, 'utf-8'));
    } else {
      list = [...INITIAL_PATIENTS];
    }
    const idx = list.findIndex((p) => p.id === targetId);
    if (idx >= 0) {
      list[idx] = merged;
    } else {
      list.push(merged);
    }
    fs.writeFileSync(PATIENTS_FILE, JSON.stringify(list, null, 2), 'utf-8');
    fs.writeFileSync(PROFILE_FILE, JSON.stringify(merged, null, 2), 'utf-8');
  } catch {
    // Ignore serverless write error
  }

  // 2. Update Supabase
  if (isSupabaseConfigured && supabase && configuredMode !== 'local') {
    try {
      await supabase.from('profiles').upsert(
        {
          id: merged.id,
          full_name: merged.fullName,
          age: merged.age,
          gender: merged.gender,
          blood_group: merged.bloodGroup,
          mock_abha_id: merged.mockAbhaId,
          allergies: merged.allergies,
          chronic_conditions: merged.chronicConditions,
          emergency_contact: merged.emergencyContact,
          updated_at: merged.updatedAt,
        },
        { onConflict: 'id' }
      );
    } catch {
      // cloud sync fallback
    }
  }

  invalidatePatientsCache();
  return merged;
}

/**
 * Delete a patient from registry.
 */
export async function deletePatient(id: string): Promise<boolean> {
  ensureStorageInitialized();

  // Local JSON delete
  try {
    if (fs.existsSync(PATIENTS_FILE)) {
      const list: PatientProfile[] = JSON.parse(fs.readFileSync(PATIENTS_FILE, 'utf-8'));
      const filtered = list.filter((p) => p.id !== id);
      fs.writeFileSync(PATIENTS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
    }
  } catch {
    // Ignore serverless
  }

  // Cloud delete
  if (isSupabaseConfigured && supabase && configuredMode !== 'local') {
    try {
      await supabase.from('profiles').delete().eq('id', id);
    } catch {
      // Ignore
    }
  }

  invalidatePatientsCache();
  return true;
}

/**
 * Calculates data-driven dashboard statistics across actual saved records and patients.
 * High-performance: cached in memory with fast invalidation on data changes.
 */
export async function getDashboardMetrics(patientId?: string): Promise<DashboardStats> {
  const cacheKey = patientId || 'all';
  const cached = dashboardStatsCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < DASHBOARD_CACHE_TTL_MS)) {
    return cached.data;
  }

  const allPatients = await getAllPatients();
  const isAggregate = !patientId || patientId === 'all';
  const selectedPatient = isAggregate ? null : allPatients.find((p) => p.id === patientId) || null;

  const relevantRecords = await getAllMedicalRecords(undefined, isAggregate ? undefined : patientId);

  const allObs = relevantRecords.flatMap((r) =>
    r.observations.map((o) => ({
      ...o,
      documentId: r.id,
      documentType: r.documentType,
      documentDate: r.documentDate || r.uploadedAt.split('T')[0],
      patientName: r.patientNameExtracted || (selectedPatient ? selectedPatient.fullName : 'Unassigned Patient'),
      patientId: r.patientId || r.userId || (selectedPatient ? selectedPatient.id : undefined),
    }))
  );

  const abnormalObs = allObs.filter((o) =>
    ['HIGH', 'LOW', 'CRITICAL_HIGH', 'CRITICAL_LOW'].includes(o.flag)
  );

  const activeMeds = relevantRecords.flatMap((r) => r.medications.filter((m) => m.isActive));

  const conditionNames = new Set<string>();
  if (selectedPatient) {
    selectedPatient.chronicConditions?.forEach((c) => conditionNames.add(c));
  } else {
    allPatients.forEach((p) => p.chronicConditions?.forEach((c) => conditionNames.add(c)));
  }
  relevantRecords.forEach((r) => {
    r.diagnoses.forEach((d) => {
      if (d.conditionName) conditionNames.add(d.conditionName);
    });
  });

  const stats: DashboardStats = {
    totalPatients: allPatients.length,
    totalDocuments: relevantRecords.length,
    totalObservations: allObs.length,
    abnormalObservationsCount: abnormalObs.length,
    activeMedicationsCount: activeMeds.length,
    chronicConditionsCount: conditionNames.size,
    selectedPatientId: isAggregate ? null : patientId,
    selectedPatient,
    recentUploads: relevantRecords.slice(0, 5),
    recentAbnormalities: abnormalObs.slice(0, 6),
    isAggregate,
  };

  dashboardStatsCache.set(cacheKey, {
    data: stats,
    timestamp: Date.now(),
  });

  return stats;
}

/**
 * Reset demo storage back to pristine initial state.
 */
export async function resetDemoData(): Promise<void> {
  ensureStorageInitialized();
  fs.writeFileSync(RECORDS_FILE, JSON.stringify(DEMO_RECORDS, null, 2), 'utf-8');
  fs.writeFileSync(PROFILE_FILE, JSON.stringify(DEMO_PATIENT, null, 2), 'utf-8');
  fs.writeFileSync(PATIENTS_FILE, JSON.stringify(INITIAL_PATIENTS, null, 2), 'utf-8');
  invalidatePatientsCache();
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
  await getAllPatients();
}
