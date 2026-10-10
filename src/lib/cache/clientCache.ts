import { PatientProfile, MedicalDocumentRecord, DashboardStats } from '../types/medical';

export const FALLBACK_PATIENTS: PatientProfile[] = [
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

// Memory cache for active browser session
const memoryStore = {
  patients: null as PatientProfile[] | null,
  profiles: new Map<string, PatientProfile>(),
  records: new Map<string, MedicalDocumentRecord[]>(),
  stats: new Map<string, DashboardStats>(),
};

function safeSessionGet(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSessionSet(key: string, val: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, val);
  } catch {
    // Ignore storage quota limits
  }
}

export function getCachedPatients(): PatientProfile[] {
  if (memoryStore.patients && memoryStore.patients.length > 0) {
    return memoryStore.patients;
  }
  const raw = safeSessionGet('lifecare_patients');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryStore.patients = parsed;
        return parsed;
      }
    } catch {
      // Ignore JSON parse errors
    }
  }
  return FALLBACK_PATIENTS;
}

export function setCachedPatients(patients: PatientProfile[]): void {
  if (!Array.isArray(patients) || patients.length === 0) return;
  memoryStore.patients = patients;
  safeSessionSet('lifecare_patients', JSON.stringify(patients));
}

export function getCachedProfile(patientId?: string): PatientProfile {
  const targetId = patientId || 'pat-meera-nambiar';
  if (memoryStore.profiles.has(targetId)) {
    return memoryStore.profiles.get(targetId)!;
  }
  const raw = safeSessionGet(`lifecare_profile_${targetId}`);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id) {
        memoryStore.profiles.set(targetId, parsed);
        return parsed;
      }
    } catch {
      // Ignore JSON parse errors
    }
  }
  const all = getCachedPatients();
  const matched = all.find((p) => p.id === targetId) || all[0] || FALLBACK_PATIENTS[0];
  return matched;
}

export function setCachedProfile(profile: PatientProfile): void {
  if (!profile || !profile.id) return;
  memoryStore.profiles.set(profile.id, profile);
  safeSessionSet(`lifecare_profile_${profile.id}`, JSON.stringify(profile));
}

export function getCachedRecords(patientId?: string): MedicalDocumentRecord[] {
  const key = patientId || 'all';
  if (memoryStore.records.has(key)) {
    return memoryStore.records.get(key)!;
  }
  const raw = safeSessionGet(`lifecare_records_${key}`);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memoryStore.records.set(key, parsed);
        return parsed;
      }
    } catch {
      // Ignore JSON parse errors
    }
  }
  return [];
}

export function setCachedRecords(records: MedicalDocumentRecord[], patientId?: string): void {
  const key = patientId || 'all';
  memoryStore.records.set(key, records);
  safeSessionSet(`lifecare_records_${key}`, JSON.stringify(records));
}

export function getCachedDashboardStats(patientId?: string): DashboardStats | null {
  const key = patientId || 'all';
  if (memoryStore.stats.has(key)) {
    return memoryStore.stats.get(key)!;
  }
  const raw = safeSessionGet(`lifecare_stats_${key}`);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.totalDocuments === 'number') {
        memoryStore.stats.set(key, parsed);
        return parsed;
      }
    } catch {
      // Ignore JSON parse errors
    }
  }
  return null;
}

export function setCachedDashboardStats(stats: DashboardStats, patientId?: string): void {
  const key = patientId || 'all';
  memoryStore.stats.set(key, stats);
  safeSessionSet(`lifecare_stats_${key}`, JSON.stringify(stats));
}

export function clearClientCache(): void {
  memoryStore.patients = null;
  memoryStore.profiles.clear();
  memoryStore.records.clear();
  memoryStore.stats.clear();
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.clear();
    } catch {
      // Ignore
    }
  }
}
