'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Calendar,
  Building,
  AlertTriangle,
  Pill,
  Stethoscope,
  ArrowLeft,
  Download,
  Printer,
  RefreshCw,
  Languages,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  Copy,
  Check,
  Shield,
  Layers,
} from 'lucide-react';
import { MedicalDocumentRecord, ExtractedObservation } from '@/lib/types/medical';
import DocumentTypeBadge from '@/components/DocumentTypeBadge';
import ObservationsTable from '@/components/ObservationsTable';

type ActiveTab = 'summary' | 'observations' | 'medications' | 'raw_text' | 'fhir';

function RecordDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [record, setRecord] = useState<MedicalDocumentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('summary');
  const [summaryLang, setSummaryLang] = useState<'en' | 'hi'>('en');
  const [fhirData, setFhirData] = useState<string | null>(null);
  const [retryingAi, setRetryingAi] = useState(false);
  const [copiedFhir, setCopiedFhir] = useState(false);

  useEffect(() => {
    async function loadRecord() {
      try {
        setLoading(true);
        const res = await fetch(`/api/records/${id}`);
        if (!res.ok) {
          throw new Error('Medical record not found');
        }
        const data = await res.json();
        setRecord(data.record);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error loading record';
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadRecord();
    }
  }, [id]);

  // Load FHIR data when tab selected
  const handleSelectFhirTab = async () => {
    setActiveTab('fhir');
    if (!fhirData && id) {
      try {
        const res = await fetch(`/api/records/${id}/fhir`);
        if (res.ok) {
          const json = await res.json();
          setFhirData(JSON.stringify(json, null, 2));
        }
      } catch (e) {
        console.error('Failed to load FHIR bundle:', e);
      }
    }
  };

  const handleToggleObservationReview = async (index: number) => {
    if (!record) return;
    const updatedObs = [...record.observations];
    updatedObs[index].requiresReview = !updatedObs[index].requiresReview;

    setRecord({ ...record, observations: updatedObs });

    try {
      await fetch(`/api/records/${record.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ observations: updatedObs }),
      });
    } catch (e) {
      console.error('Failed to update review status:', e);
    }
  };

  const handleRetryAi = async () => {
    if (!record) return;
    setRetryingAi(true);
    try {
      const savedKey = localStorage.getItem('medimind_gemini_key') || undefined;
      const res = await fetch(`/api/records/${record.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'retry_ai',
          apiKey: savedKey,
          generateHindi: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Retry extraction failed');
      } else {
        setRecord(data.record);
        alert('AI structured extraction updated successfully!');
      }
    } catch (err) {
      console.error('Retry error:', err);
      alert('An error occurred during retry.');
    } finally {
      setRetryingAi(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-32 bg-slate-200 rounded"></div>
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
          <div className="h-96 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">{error || 'Record Not Found'}</h2>
        <p className="text-xs text-slate-500">
          The requested medical record could not be found or may have been deleted.
        </p>
        <Link
          href="/records"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Records</span>
        </Link>
      </div>
    );
  }

  const abnormalCount = record.observations.filter(
    (o) => o.flag === 'HIGH' || o.flag === 'LOW' || o.flag === 'CRITICAL_HIGH' || o.flag === 'CRITICAL_LOW'
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/records"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Records</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleRetryAi}
            disabled={retryingAi}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retryingAi ? 'animate-spin' : ''}`} />
            <span>{retryingAi ? 'Re-extracting...' : 'Re-run Gemini AI'}</span>
          </button>
        </div>
      </div>

      {/* Record Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <DocumentTypeBadge type={record.documentType} />
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Date: {record.documentDate || record.uploadedAt.split('T')[0]}
              </span>
              {record.extractionMethod === 'demo_fixture' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                  Verified Demo Fixture
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {record.fileName}
            </h1>

            {record.providerName && (
              <div className="text-xs text-slate-600 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>Provider: {record.providerName}</span>
              </div>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            {abnormalCount > 0 && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-center">
                <div className="text-lg font-bold text-red-700">{abnormalCount}</div>
                <div className="text-[10px] font-semibold text-red-600">Out of Range</div>
              </div>
            )}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-lg font-bold text-slate-800">{record.observations.length}</div>
              <div className="text-[10px] font-semibold text-slate-500">Observations</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-lg font-bold text-slate-800">{record.medications.length}</div>
              <div className="text-[10px] font-semibold text-slate-500">Medications</div>
            </div>
          </div>
        </div>

        {/* Tab navigation bar */}
        <div className="flex flex-wrap items-center gap-1 pt-4 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'summary'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            AI Health Summary
          </button>

          <button
            onClick={() => setActiveTab('observations')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'observations'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Lab Observations</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 font-bold">
              {record.observations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('medications')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'medications'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Medications</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 font-bold">
              {record.medications.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('raw_text')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'raw_text'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Extracted Source Text
          </button>

          <button
            onClick={handleSelectFhirTab}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
              activeTab === 'fhir'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>FHIR R4 Bundle</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT 1: AI HEALTH SUMMARY */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Plain-Language Explanation Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Plain-Language Clinical Explanation
                </h2>
              </div>

              {/* Language Switch */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setSummaryLang('en')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    summaryLang === 'en'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setSummaryLang('hi')}
                  disabled={!record.summary.summaryHi}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                    summaryLang === 'hi'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 disabled:opacity-50'
                  }`}
                >
                  <Languages className="w-3.5 h-3.5 text-blue-600" />
                  <span>हिंदी (Hindi)</span>
                </button>
              </div>
            </div>

            {/* Explanation Body */}
            <div className="p-5 rounded-xl bg-slate-50/80 border border-slate-200 text-sm leading-relaxed text-slate-800">
              {summaryLang === 'en'
                ? record.summary.summaryEn
                : record.summary.summaryHi || 'Hindi translation not available for this record.'}
            </div>

            {/* Cautious Medical Notice */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>Medical Interpretation Notice:</strong> A test value outside a reference range does not by itself establish a clinical diagnosis. Biological variations, timing, and individual medical history play a significant role. Always discuss abnormal values directly with your doctor.
              </div>
            </div>
          </div>

          {/* Key Findings & Out-of-Range Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Key Findings */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Key Stated Findings</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-700">
                {record.summary.keyFindings.map((finding, i) => (
                  <li key={i} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0"></span>
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Questions to Ask Doctor */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-teal-600" />
                <span>Suggested Questions for Your Doctor</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-700">
                {record.summary.doctorQuestions.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 p-2 rounded-lg bg-teal-50/50 border border-teal-100">
                    <span className="font-semibold text-teal-700 shrink-0">Q{i + 1}.</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: OBSERVATIONS TABLE */}
      {activeTab === 'observations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Extracted Lab Tests & Observations ({record.observations.length})
            </h2>
            <span className="text-xs text-slate-500">
              Evaluated deterministically against source-supplied ranges
            </span>
          </div>

          <ObservationsTable
            observations={record.observations}
            onToggleReview={handleToggleObservationReview}
            editable={true}
          />
        </div>
      )}

      {/* TAB CONTENT 3: MEDICATIONS & DIAGNOSES */}
      {activeTab === 'medications' && (
        <div className="space-y-6">
          {/* Medications Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Pill className="w-4 h-4 text-blue-600" />
              <span>Extracted Medications ({record.medications.length})</span>
            </h2>

            {record.medications.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-xl">
                No medications prescribed or mentioned in this document.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {record.medications.map((med, i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">{med.medicationName}</span>
                      <span className="text-xs px-2 py-0.5 rounded font-semibold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                        {med.dosage || 'Dosage not stated'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-0.5">
                      <div>Frequency: <strong className="text-slate-800">{med.frequency || 'N/A'}</strong></div>
                      <div>Duration: <strong className="text-slate-800">{med.duration || 'N/A'}</strong></div>
                      <div>Route: <strong className="text-slate-800">{med.route || 'Oral'}</strong></div>
                    </div>

                    {med.instructions && (
                      <div className="text-[11px] p-2 rounded bg-white border border-slate-200 text-slate-700 italic">
                        &quot;{med.instructions}&quot;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Diagnoses Card */}
          {record.diagnoses.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-purple-600" />
                <span>Explicitly Stated Diagnoses ({record.diagnoses.length})</span>
              </h2>

              <div className="space-y-3">
                {record.diagnoses.map((diag, i) => (
                  <div key={i} className="p-3.5 rounded-xl border border-purple-100 bg-purple-50/30 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-xs text-slate-900">{diag.conditionName}</div>
                      {diag.providerNotes && (
                        <div className="text-[11px] text-slate-600 mt-0.5">{diag.providerNotes}</div>
                      )}
                    </div>
                    {diag.icd10Code && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold shrink-0">
                        {diag.icd10Code}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 4: RAW EXTRACTED SOURCE TEXT */}
      {activeTab === 'raw_text' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Raw Extracted Document Text</h2>
              <p className="text-xs text-slate-500">
                Extracted via {record.extractionMethod}. Verifiable against original document upload.
              </p>
            </div>

            {record.filePath && (
              <a
                href={record.filePath}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Original File</span>
              </a>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto max-h-[500px] leading-relaxed whitespace-pre-wrap">
            {record.rawExtractedText || 'No raw text recorded for this document.'}
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: HL7 FHIR R4 JSON BUNDLE */}
      {activeTab === 'fhir' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>HL7 FHIR R4 Bundle Export</span>
              </h2>
              <p className="text-xs text-slate-500">
                Maps Patient, DiagnosticReport, Observation, and MedicationStatement resources.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (fhirData) {
                    navigator.clipboard.writeText(fhirData);
                    setCopiedFhir(true);
                    setTimeout(() => setCopiedFhir(false), 2000);
                  }
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                {copiedFhir ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedFhir ? 'Copied!' : 'Copy JSON'}</span>
              </button>

              <a
                href={`/api/records/${record.id}/fhir`}
                download={`fhir_${record.id}.json`}
                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download FHIR</span>
              </a>
            </div>
          </div>

          {/* FHIR Documentation Box */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-1">
            <div className="font-semibold text-blue-950">HL7 FHIR Interoperability Standard:</div>
            <div>
              Resources mapped: <code className="font-mono bg-blue-100 px-1 rounded">Patient</code>, <code className="font-mono bg-blue-100 px-1 rounded">Observation</code> (with reference ranges & flags), <code className="font-mono bg-blue-100 px-1 rounded">MedicationStatement</code>, <code className="font-mono bg-blue-100 px-1 rounded">DiagnosticReport</code>.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[500px] leading-relaxed whitespace-pre">
            {fhirData || 'Loading HL7 FHIR bundle...'}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RecordDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-32 bg-slate-200 rounded"></div>
            <div className="h-28 bg-slate-200 rounded-2xl"></div>
            <div className="h-96 bg-slate-200 rounded-2xl"></div>
          </div>
        </div>
      }
    >
      <RecordDetailContent />
    </Suspense>
  );
}
