'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  FileText,
  UploadCloud,
  AlertTriangle,
  Pill,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { MedicalDocumentRecord, PatientProfile } from '@/lib/types/medical';
import DocumentTypeBadge from '@/components/DocumentTypeBadge';
import StatusBadge from '@/components/StatusBadge';

export default function DashboardPage() {
  const [records, setRecords] = useState<MedicalDocumentRecord[]>([]);
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [recordsRes, profileRes] = await Promise.all([
          fetch('/api/records'),
          fetch('/api/profile'),
        ]);

        if (recordsRes.ok) {
          const rData = await recordsRes.json();
          setRecords(rData.records || []);
        }

        if (profileRes.ok) {
          const pData = await profileRes.json();
          setPatient(pData.profile);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Collect abnormal observations across documents for the alert panel
  const abnormalObservations = records.flatMap((r) =>
    r.observations
      .filter((o) => o.flag === 'HIGH' || o.flag === 'LOW' || o.flag === 'CRITICAL_HIGH' || o.flag === 'CRITICAL_LOW')
      .map((obs) => ({
        ...obs,
        documentId: r.id,
        documentType: r.documentType,
        documentDate: r.documentDate || r.uploadedAt.split('T')[0],
      }))
  );

  // Active medications
  const activeMedications = records.flatMap((r) =>
    r.medications.filter((m) => m.isActive)
  );

  if (loading) {
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
      {/* Top Banner: Patient Summary & Quick Action */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {patient?.fullName || 'Patient Health Dashboard'}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-semibold border border-teal-200">
              Active Patient
            </span>
          </div>

          <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>Age: {patient?.age} Yrs ({patient?.gender})</span>
            <span>•</span>
            <span>Blood Group: <strong className="text-slate-700">{patient?.bloodGroup}</strong></span>
            <span>•</span>
            <span>Mock ABHA: <span className="font-mono text-slate-700">{patient?.mockAbhaId}</span></span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/timeline"
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4 text-slate-500" />
            <span>View Timeline</span>
          </Link>
          <Link
            href="/upload"
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition shadow-sm flex items-center gap-1.5"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Document</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Documents */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{records.length}</div>
            <div className="text-xs text-slate-500 font-medium">Medical Documents</div>
          </div>
        </div>

        {/* Abnormal Observations */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{abnormalObservations.length}</div>
            <div className="text-xs text-slate-500 font-medium">Out-of-Range Flags</div>
          </div>
        </div>

        {/* Active Medications */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{activeMedications.length}</div>
            <div className="text-xs text-slate-500 font-medium">Active Medications</div>
          </div>
        </div>

        {/* Conditions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {patient?.chronicConditions.length || 0}
            </div>
            <div className="text-xs text-slate-500 font-medium">Chronic Conditions</div>
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
                Recent Out-of-Range Observations ({abnormalObservations.length})
              </h2>
            </div>
            <span className="text-xs text-amber-800 font-medium">
              Based on reference ranges in original reports
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

      {/* Two Column Layout: Recent Documents & Active Regimen */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recent Documents */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent Medical Documents</h2>
            <Link
              href="/records"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <span>View all ({records.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-sm overflow-hidden">
            {records.slice(0, 5).map((doc) => {
              const abnormalCount = doc.observations.filter(
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
                      {doc.extractionMethod === 'demo_fixture' && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 font-medium">
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
                      {doc.summary.summaryEn}
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

        {/* Right 1 Col: Active Treatment Regimen & Health Profile Summary */}
        <div className="space-y-6">
          {/* Active Medications Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Pill className="w-4 h-4 text-blue-600" />
                <span>Active Prescriptions ({activeMedications.length})</span>
              </h2>
              <Link href="/records?type=Prescription" className="text-xs text-teal-600 hover:underline">
                View Rx
              </Link>
            </div>

            <div className="space-y-2.5">
              {activeMedications.map((med, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{med.medicationName}</span>
                    <span className="font-mono text-slate-600 font-medium">{med.dosage}</span>
                  </div>
                  <div className="text-slate-600">{med.frequency}</div>
                  {med.instructions && (
                    <div className="text-slate-500 italic text-[11px]">&quot;{med.instructions}&quot;</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Upload Callout Card */}
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Add New Document</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Upload your latest lab tests, prescriptions, or imaging reports for instant extraction.
              </p>
            </div>
            <Link
              href="/upload"
              className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition"
            >
              Upload PDF or Image
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
