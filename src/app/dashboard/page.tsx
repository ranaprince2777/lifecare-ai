'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Activity,
  FileText,
  UploadCloud,
  AlertTriangle,
  Pill,
  Calendar,
  ArrowRight,
  Building,
  Users,
  ChevronDown,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { MedicalDocumentRecord, PatientProfile, DashboardStats } from '@/lib/types/medical';
import DocumentTypeBadge from '@/components/DocumentTypeBadge';
import StatusBadge from '@/components/StatusBadge';
import LabTrendsComparison from '@/components/LabTrendsComparison';

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialPatientId = searchParams.get('patientId') || 'all';

  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId);
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [records, setRecords] = useState<MedicalDocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Load patients list for dropdown switcher
  useEffect(() => {
    async function loadPatients() {
      try {
        const res = await fetch('/api/patients');
        const data = await res.json();
        if (data.success && Array.isArray(data.patients)) {
          setPatients(data.patients);
        }
      } catch (err) {
        console.error('Failed to load patients for selector:', err);
      }
    }
    loadPatients();
  }, []);

  // Load dashboard metrics and records whenever selectedPatientId changes
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    async function loadDashboard() {
      try {
        setLoading(true);
        const query = selectedPatientId && selectedPatientId !== 'all' ? `?patientId=${encodeURIComponent(selectedPatientId)}` : '';

        const [statsRes, recordsRes] = await Promise.all([
          fetch(`/api/dashboard${query}`, { signal: controller.signal }),
          fetch(`/api/records${query}`, { signal: controller.signal }),
        ]);

        if (statsRes.ok) {
          const sData = await statsRes.json();
          setStats(sData.stats);
        }

        if (recordsRes.ok) {
          const rData = await recordsRes.json();
          setRecords(rData.records || []);
        }
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError') {
          console.error('Failed to load dashboard statistics:', err);
        }
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [selectedPatientId]);

  const handlePatientChange = (newId: string) => {
    setSelectedPatientId(newId);
    if (newId === 'all') {
      router.push('/dashboard');
    } else {
      router.push(`/dashboard?patientId=${encodeURIComponent(newId)}`);
    }
  };

  const currentPatient =
    selectedPatientId !== 'all' ? patients.find((p) => p.id === selectedPatientId) : null;

  // Derive out-of-range observations from real saved records
  const abnormalObservations = records.flatMap((r) =>
    (r.observations || [])
      .filter((o) => o.flag === 'HIGH' || o.flag === 'LOW' || o.flag === 'CRITICAL_HIGH' || o.flag === 'CRITICAL_LOW')
      .map((obs) => ({
        ...obs,
        documentId: r.id,
        documentType: r.documentType,
        documentDate: r.documentDate || r.uploadedAt.split('T')[0],
        patientName: r.patientNameExtracted || 'Assigned Patient',
      }))
  );

  // Derive active medications
  const activeMedications = records.flatMap((r) =>
    (r.medications || []).map((m) => ({
      ...m,
      sourceDoc: r.fileName,
      docId: r.id,
    }))
  );

  if (loading && !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-28 bg-slate-200 rounded-2xl w-full"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="h-24 bg-slate-200 rounded-xl"></div>
            <div className="h-24 bg-slate-200 rounded-xl"></div>
            <div className="h-24 bg-slate-200 rounded-xl"></div>
            <div className="h-24 bg-slate-200 rounded-xl"></div>
          </div>
          <div className="h-64 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner: Patient Context Switcher & Dynamic Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {currentPatient ? currentPatient.fullName : 'Aggregate Clinical Dashboard'}
            </h1>

            {currentPatient ? (
              currentPatient.isDemo ? (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-semibold border border-amber-200 flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  Demo Patient Fixture
                </span>
              ) : (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified Patient Record
                </span>
              )
            ) : (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 font-semibold border border-teal-200 flex items-center gap-1">
                <Users className="w-3 h-3" />
                All Patients Directory View
              </span>
            )}
          </div>

          {currentPatient ? (
            <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>Age: {currentPatient.age ? `${currentPatient.age} Yrs` : 'Not recorded'} ({currentPatient.gender || 'Unknown'})</span>
              <span>•</span>
              <span>Blood Group: <strong className="text-slate-700">{currentPatient.bloodGroup || 'Not Recorded'}</strong></span>
              {currentPatient.mockAbhaId && (
                <>
                  <span>•</span>
                  <span>ABHA: <span className="font-mono text-slate-700">{currentPatient.mockAbhaId}</span></span>
                </>
              )}
              <span>•</span>
              <span className="font-mono text-slate-500">ID: {currentPatient.id}</span>
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Aggregated statistics derived from persisted records across {stats?.totalPatients || patients.length} registered patients.
            </p>
          )}
        </div>

        {/* Patient Switcher & Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Patient Selector Dropdown */}
          <div className="relative">
            <select
              value={selectedPatientId}
              onChange={(e) => handlePatientChange(e.target.value)}
              className="appearance-none w-full sm:w-64 px-3.5 py-2 pr-9 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer shadow-xs"
            >
              <option value="all">All Patients (Aggregate Directory)</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} {p.isDemo ? '[Demo]' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/patients"
              className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Registry</span>
            </Link>

            <Link
              href={currentPatient ? `/upload?patientId=${encodeURIComponent(currentPatient.id)}` : '/upload'}
              className="px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition shadow-xs flex items-center gap-1.5"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Document</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Dynamic Data-Driven Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Documents */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{stats?.totalDocuments ?? records.length}</div>
            <div className="text-xs text-slate-500 font-medium">Medical Documents</div>
          </div>
        </div>

        {/* Observations Count */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{stats?.totalObservations ?? 0}</div>
            <div className="text-xs text-slate-500 font-medium">Extracted Observations</div>
          </div>
        </div>

        {/* Abnormal Observations */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{stats?.abnormalObservationsCount ?? abnormalObservations.length}</div>
            <div className="text-xs text-slate-500 font-medium">Out-of-Range Flags</div>
          </div>
        </div>

        {/* Active Medications or Chronic Conditions */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            {selectedPatientId === 'all' ? <Users className="w-5 h-5" /> : <Pill className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">
              {selectedPatientId === 'all'
                ? stats?.totalPatients ?? patients.length
                : stats?.activeMedicationsCount ?? activeMedications.length}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {selectedPatientId === 'all' ? 'Registered Patients' : 'Active Medications'}
            </div>
          </div>
        </div>
      </div>

      {/* Abnormal Observations Callout Banner */}
      {abnormalObservations.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
              <h2 className="text-base font-bold text-amber-950">
                Out-of-Range Clinical Observations ({abnormalObservations.length})
              </h2>
            </div>
            <span className="text-xs text-amber-800 font-medium">
              Deterministic validation from source lab reference ranges
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {abnormalObservations.slice(0, 6).map((obs, i) => (
              <Link
                key={i}
                href={`/records/${obs.documentId}`}
                className="bg-white p-3.5 rounded-xl border border-amber-200/80 hover:border-amber-400 hover:shadow-sm transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-slate-900 text-sm">{obs.testName}</span>
                    <StatusBadge flag={obs.flag} />
                  </div>
                  <div className="text-xs text-slate-600">
                    Value: <strong className="text-slate-900 font-mono">{obs.testResultValue} {obs.unit}</strong>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Source Ref: {obs.referenceRangeRaw || 'N/A'}
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-teal-700 font-medium">
                  <span>{obs.documentType} ({obs.documentDate})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Longitudinal Lab Trends & Historical Comparison (rendered when records exist) */}
      {records.length > 0 && <LabTrendsComparison records={records} />}

      {/* Empty State when 0 records exist */}
      {records.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm max-w-lg mx-auto">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">
            {currentPatient ? `No Records for ${currentPatient.fullName}` : 'No Medical Records Ingested Yet'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            {currentPatient
              ? 'Upload a medical document (lab test, prescription, or clinical summary) to link it to this patient.'
              : 'Upload medical documents or register patients to populate clinical metrics and timelines.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href={currentPatient ? `/upload?patientId=${encodeURIComponent(currentPatient.id)}` : '/upload'}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white font-medium text-xs hover:bg-teal-700 transition"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Document</span>
            </Link>
            <Link
              href="/patients"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium text-xs hover:bg-slate-200 transition"
            >
              <Users className="w-4 h-4" />
              <span>View Registry</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Two Column Layout: Recent Documents & Active Regimen */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Recent Documents */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {currentPatient ? `${currentPatient.fullName}'s Documents` : 'Recent Ingested Documents'}
              </h2>
              <Link
                href={currentPatient ? `/records?patientId=${encodeURIComponent(currentPatient.id)}` : '/records'}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                <span>View all ({records.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-sm overflow-hidden">
              {records.slice(0, 5).map((doc) => {
                const abnormalCount = (doc.observations || []).filter(
                  (o) => o.flag === 'HIGH' || o.flag === 'LOW' || o.flag === 'CRITICAL_HIGH' || o.flag === 'CRITICAL_LOW'
                ).length;

                return (
                  <div key={doc.id} className="p-5 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-lg">
                      <div className="flex items-center gap-2 flex-wrap">
                        <DocumentTypeBadge type={doc.documentType} />
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {doc.documentDate || doc.uploadedAt.split('T')[0]}
                        </span>
                        {doc.patientId && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                            {doc.patientNameExtracted || doc.patientId}
                          </span>
                        )}
                        {doc.extractionMethod === 'demo_fixture' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                            Demo Fixture
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-slate-900 truncate">
                        {doc.fileName}
                      </h3>

                      {doc.providerName && (
                        <div className="text-xs text-slate-600 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{doc.providerName}</span>
                        </div>
                      )}

                      <p className="text-xs text-slate-500 line-clamp-2">
                        {doc.summary?.summaryEn}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                      {abnormalCount > 0 ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                          {abnormalCount} flagged
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Within range
                        </span>
                      )}

                      <Link
                        href={`/records/${doc.id}`}
                        className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold transition"
                      >
                        View Report
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 1 Col: Active Medications & Action */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-blue-600" />
                  <span>Prescribed Medications ({activeMedications.length})</span>
                </h2>
                <Link href="/records?type=Prescription" className="text-xs text-teal-600 hover:underline">
                  View Rx
                </Link>
              </div>

              {activeMedications.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No medication data recorded in current documents.</p>
              ) : (
                <div className="space-y-2.5">
                  {activeMedications.slice(0, 5).map((med, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{med.medicationName}</span>
                        <span className="font-mono text-slate-600 font-medium">{med.dosage}</span>
                      </div>
                      <div className="text-slate-600">{med.frequency}</div>
                      {med.instructions && <div className="text-slate-500 text-[11px]">&quot;{med.instructions}&quot;</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Upload Callout Card */}
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Add New Document</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Upload lab tests, prescriptions, or imaging reports for deterministic OCR and Gemini extraction.
                </p>
              </div>
              <Link
                href={currentPatient ? `/upload?patientId=${encodeURIComponent(currentPatient.id)}` : '/upload'}
                className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition"
              >
                Upload PDF or Image
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-28 bg-slate-200 rounded-2xl w-full"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="h-24 bg-slate-200 rounded-xl"></div>
            <div className="h-24 bg-slate-200 rounded-xl"></div>
            <div className="h-24 bg-slate-200 rounded-xl"></div>
            <div className="h-24 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
