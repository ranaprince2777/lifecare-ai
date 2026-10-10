'use client';

import { useEffect, useState, use, Suspense } from 'react';
import Link from 'next/link';
import {
  FileText,
  UploadCloud,
  Activity,
  Heart,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ChevronRight,
  Tag,
  Pill,
  Stethoscope,
  ExternalLink,
} from 'lucide-react';
import { PatientProfile, MedicalDocumentRecord } from '@/lib/types/medical';

function PatientDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const patientId = decodeURIComponent(resolvedParams.id);

  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [records, setRecords] = useState<MedicalDocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'documents' | 'observations' | 'medications' | 'diagnoses' | 'timeline'>('documents');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/patients/${encodeURIComponent(patientId)}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to fetch patient data');
        }
        setPatient(data.patient);
        setRecords(data.records || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load patient');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [patientId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">Loading patient command center...</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-md text-center">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">Patient Not Found</h2>
          <p className="text-sm text-slate-500 mb-6">{error || 'Unable to locate patient record.'}</p>
          <Link
            href="/patients"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white font-medium text-sm hover:bg-teal-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Patient Registry</span>
          </Link>
        </div>
      </div>
    );
  }

  // Derive all data points from this patient's actual saved documents
  const allObservations = records.flatMap((r) =>
    (r.observations || []).map((obs) => ({
      ...obs,
      sourceDocName: r.fileName,
      sourceDocId: r.id,
      docDate: r.documentDate || r.uploadedAt.split('T')[0],
    }))
  );

  const abnormalObservations = allObservations.filter(
    (o) => o.flag === 'HIGH' || o.flag === 'LOW' || o.flag === 'CRITICAL_HIGH' || o.flag === 'CRITICAL_LOW'
  );

  const allMedications = records.flatMap((r) =>
    (r.medications || []).map((med) => ({
      ...med,
      sourceDocName: r.fileName,
      sourceDocId: r.id,
    }))
  );

  const allDiagnoses = records.flatMap((r) =>
    (r.diagnoses || []).map((diag) => ({
      ...diag,
      sourceDocName: r.fileName,
      sourceDocId: r.id,
    }))
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/patients"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Patient Registry</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={`/upload?patientId=${encodeURIComponent(patient.id)}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white font-medium text-sm hover:bg-teal-700 transition shadow-sm"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Document for {patient.fullName}</span>
            </Link>
          </div>
        </div>

        {/* Patient Profile Card Header */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-2xl shadow-sm shrink-0">
                {patient.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{patient.fullName}</h1>
                  {patient.isDemo ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      Demo Patient
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified Patient
                    </span>
                  )}
                  {patient.bloodGroup && (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {patient.bloodGroup}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium pt-1">
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">ID: {patient.id}</span>
                  {patient.age && <span>• {patient.age} Years</span>}
                  <span>• {patient.gender || 'Not Recorded'}</span>
                  {patient.mockAbhaId && <span>• ABHA: <span className="font-mono text-teal-700">{patient.mockAbhaId}</span></span>}
                  {patient.contact && <span>• Contact: {patient.contact}</span>}
                </div>

                {patient.chronicConditions && patient.chronicConditions.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-2">
                    <span className="text-xs font-semibold text-slate-400">Clinical Conditions:</span>
                    {patient.chronicConditions.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-medium">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80 self-start">
              <div className="text-center px-3 border-r border-slate-200">
                <span className="block text-xl font-bold text-slate-900">{records.length}</span>
                <span className="text-[11px] text-slate-500 font-medium">Documents</span>
              </div>
              <div className="text-center px-3 border-r border-slate-200">
                <span className="block text-xl font-bold text-slate-900">{allObservations.length}</span>
                <span className="text-[11px] text-slate-500 font-medium">Observations</span>
              </div>
              <div className="text-center px-3">
                <span className={`block text-xl font-bold ${abnormalObservations.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {abnormalObservations.length}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Out of Range</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-t border-slate-100 mt-6 pt-4 overflow-x-auto text-sm font-medium">
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition ${
                activeTab === 'documents'
                  ? 'bg-teal-50 text-teal-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Medical Documents ({records.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('observations')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition ${
                activeTab === 'observations'
                  ? 'bg-teal-50 text-teal-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Lab Observations ({allObservations.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('medications')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition ${
                activeTab === 'medications'
                  ? 'bg-teal-50 text-teal-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Pill className="w-4 h-4" />
              <span>Medications ({allMedications.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('diagnoses')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition ${
                activeTab === 'diagnoses'
                  ? 'bg-teal-50 text-teal-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Diagnoses ({allDiagnoses.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition ${
                activeTab === 'timeline'
                  ? 'bg-teal-50 text-teal-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Health Timeline</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            {records.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm max-w-lg mx-auto">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">No Documents Uploaded Yet</h3>
                <p className="text-xs text-slate-500 mt-1 mb-5">
                  This patient currently has no associated medical documents. Upload lab reports, prescriptions, or clinical summaries.
                </p>
                <Link
                  href={`/upload?patientId=${encodeURIComponent(patient.id)}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white font-medium text-xs hover:bg-teal-700 transition"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload First Document</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {records.map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 text-[11px] font-semibold border border-teal-200">
                          {rec.documentType}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {rec.documentDate || rec.uploadedAt.split('T')[0]}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm mb-1 line-clamp-1">{rec.fileName}</h3>
                      {rec.providerName && (
                        <p className="text-xs text-slate-500 mb-2">Provider: {rec.providerName}</p>
                      )}
                      {rec.summary && rec.summary.summaryEn && (
                        <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          {rec.summary.summaryEn}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs mt-3">
                      <div className="flex items-center gap-3 text-slate-500">
                        <span>{rec.observations?.length || 0} Labs</span>
                        <span>•</span>
                        <span>{rec.medications?.length || 0} Meds</span>
                      </div>
                      <Link
                        href={`/records/${encodeURIComponent(rec.id)}`}
                        className="inline-flex items-center gap-1 font-semibold text-teal-600 hover:text-teal-700"
                      >
                        <span>Full Report</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'observations' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Extracted Laboratory & Clinical Observations</h3>
                <p className="text-xs text-slate-500">
                  Directly extracted from {patient.fullName}&apos;s verified documents with source provenance.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                {allObservations.length} Total Tests
              </span>
            </div>

            {allObservations.length === 0 ? (
              <div className="p-12 text-center">
                <Activity className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No Clinical Observations Found</p>
                <p className="text-xs text-slate-400 mt-1">Upload a lab report or blood panel to extract test results.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Test Name</th>
                      <th className="py-3 px-4">Result Value</th>
                      <th className="py-3 px-4">Reference Range</th>
                      <th className="py-3 px-4">Status Flag</th>
                      <th className="py-3 px-4">Source Document</th>
                      <th className="py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allObservations.map((obs, idx) => {
                      const isHigh = obs.flag === 'HIGH' || obs.flag === 'CRITICAL_HIGH';
                      const isLow = obs.flag === 'LOW' || obs.flag === 'CRITICAL_LOW';
                      const isNormal = obs.flag === 'NORMAL';

                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-semibold text-slate-900">{obs.testName}</td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            {obs.testResultValue} {obs.unit}
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-mono">
                            {obs.referenceRangeLow !== null && obs.referenceRangeHigh !== null
                              ? `${obs.referenceRangeLow} - ${obs.referenceRangeHigh} ${obs.unit || ''}`
                              : 'Not provided'}
                          </td>
                          <td className="py-3 px-4">
                            {isHigh ? (
                              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold uppercase text-[10px]">
                                {obs.flag}
                              </span>
                            ) : isLow ? (
                              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold uppercase text-[10px]">
                                {obs.flag}
                              </span>
                            ) : isNormal ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[10px]">
                                Normal
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[10px]">
                                Unclassified
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-500 truncate max-w-[200px]">
                            <Link
                              href={`/records/${encodeURIComponent(obs.sourceDocId)}`}
                              className="text-teal-600 hover:underline flex items-center gap-1"
                            >
                              <span>{obs.sourceDocName}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-mono">{obs.docDate}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'medications' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Prescribed & Extracted Medications</h3>
            <p className="text-xs text-slate-500 mb-4">
              Medications found across {patient.fullName}&apos;s verified clinical records.
            </p>

            {allMedications.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Pill className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No medications recorded in uploaded documents.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {allMedications.map((med, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">{med.medicationName}</span>
                      <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 text-[10px] font-semibold">
                        {med.frequency || 'Daily'}
                      </span>
                    </div>
                    {med.dosage && <p className="text-xs text-slate-600 font-medium">Dosage: {med.dosage}</p>}
                    {med.instructions && <p className="text-xs text-slate-500">Instructions: {med.instructions}</p>}
                    <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-200 mt-2">
                      Source: {med.sourceDocName}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'diagnoses' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Diagnosed Clinical Conditions</h3>
            <p className="text-xs text-slate-500 mb-4">
              Conditions documented in medical reports or discharge summaries.
            </p>

            {allDiagnoses.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Stethoscope className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No diagnoses extracted from uploaded documents.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allDiagnoses.map((diag, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">{diag.conditionName}</span>
                      {diag.status && (
                        <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-semibold">
                          {diag.status}
                        </span>
                      )}
                    </div>
                    {diag.providerNotes && <p className="text-xs text-slate-600">{diag.providerNotes}</p>}
                    <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-200 mt-2">
                      Report: {diag.sourceDocName}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Patient Health Timeline</h3>
            <p className="text-xs text-slate-500 mb-6">Chronological progression of records and encounters.</p>

            {records.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Timeline requires at least one document upload.</p>
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 border-teal-200 space-y-6">
                {records.map((rec) => (
                  <div key={rec.id} className="relative">
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-teal-600 border-2 border-white" />
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-teal-700">{rec.documentType}</span>
                        <span className="text-xs font-mono text-slate-400">
                          {rec.documentDate || rec.uploadedAt.split('T')[0]}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{rec.fileName}</h4>
                      {rec.summary?.summaryEn && (
                        <p className="text-xs text-slate-600 mt-2">{rec.summary.summaryEn}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">Loading patient command center...</p>
          </div>
        </div>
      }
    >
      <PatientDetailContent params={params} />
    </Suspense>
  );
}
