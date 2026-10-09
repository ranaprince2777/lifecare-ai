import fs from 'fs';
import path from 'path';
import { MedicalDocumentRecord, PatientProfile } from '../types/medical';
import { DEMO_PATIENT, DEMO_RECORDS } from '../demo/fixtures';
import { createClient } from '@supabase/supabase-js';

const DATA_DIR = path.join(process.cwd(), 'data');
const RECORDS_FILE = path.join(DATA_DIR, 'records.json');
const PROFILE_FILE = path.join(DATA_DIR, 'patient.json');

// Initialize Supabase if keys exist
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  !supabaseUrl.includes('your-project') &&
  !supabaseKey.includes('your_supabase')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseKey!)
  : null;

/**
 * Ensures data directory and base storage files exist.
 */
function ensureStorageInitialized() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(RECORDS_FILE)) {
    fs.writeFileSync(RECORDS_FILE, JSON.stringify(DEMO_RECORDS, null, 2), 'utf-8');
  }

  if (!fs.existsSync(PROFILE_FILE)) {
    fs.writeFileSync(PROFILE_FILE, JSON.stringify(DEMO_PATIENT, null, 2), 'utf-8');
  }
}

/**
 * Get all medical documents sorted by date (newest first).
 */
export async function getAllMedicalRecords(): Promise<MedicalDocumentRecord[]> {
  ensureStorageInitialized();
  try {
    const raw = fs.readFileSync(RECORDS_FILE, 'utf-8');
    const records: MedicalDocumentRecord[] = JSON.parse(raw);
    
    // Sort chronologically (documentDate or fallback to uploadedAt)
    return records.sort((a, b) => {
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
export async function getMedicalRecordById(id: string): Promise<MedicalDocumentRecord | null> {
  const records = await getAllMedicalRecords();
  return records.find((r) => r.id === id) || null;
}

/**
 * Save a newly extracted or updated record.
 */
export async function saveMedicalRecord(record: MedicalDocumentRecord): Promise<MedicalDocumentRecord> {
  ensureStorageInitialized();
  const records = await getAllMedicalRecords();
  const existingIdx = records.findIndex((r) => r.id === record.id);

  if (existingIdx >= 0) {
    records[existingIdx] = record;
  } else {
    records.unshift(record);
  }

  fs.writeFileSync(RECORDS_FILE, JSON.stringify(records, null, 2), 'utf-8');

  // Update patient metrics count
  await recalculatePatientMetrics();

  return record;
}

/**
 * Delete a record.
 */
export async function deleteMedicalRecord(id: string): Promise<boolean> {
  ensureStorageInitialized();
  const records = await getAllMedicalRecords();
  const filtered = records.filter((r) => r.id !== id);

  if (filtered.length !== records.length) {
    fs.writeFileSync(RECORDS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
    await recalculatePatientMetrics();
    return true;
  }

  return false;
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
 * Recalculates metrics for the patient profile.
 */
async function recalculatePatientMetrics(): Promise<void> {
  const records = await getAllMedicalRecords();
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
