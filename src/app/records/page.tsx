'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  FileText,
  Search,
  Calendar,
  Building,
  AlertTriangle,
  Pill,
  Trash2,
  RefreshCw,
  UploadCloud,
  ArrowRight,
  ChevronDown,
  User,
} from 'lucide-react';
import { MedicalDocumentRecord, DocumentType, PatientProfile } from '@/lib/types/medical';
import DocumentTypeBadge from '@/components/DocumentTypeBadge';

const DOC_TYPES: Array<'All' | DocumentType> = [
  'All',
  'Lab Report',
  'Prescription',
  'Diagnostic Report',
  'Discharge Summary',
];

function RecordsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPatientId = searchParams.get('patientId') || 'all';

  const [records, setRecords] = useState<MedicalDocumentRecord[]>([]);
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'All' | DocumentType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyAbnormal, setOnlyAbnormal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load patients for dropdown
  useEffect(() => {
    fetch('/api/patients')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.patients)) {
          setPatients(data.patients);
        }
      })
      .catch((err) => console.error('Failed to load patients:', err));
  }, []);

  // Load records based on selectedPatientId
  useEffect(() => {
    let ignore = false;
    const query = selectedPatientId && selectedPatientId !== 'all' ? `?patientId=${encodeURIComponent(selectedPatientId)}` : '';

    fetch(`/api/records${query}`)
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) {
          setRecords(data.records || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('Failed to fetch records:', err);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [selectedPatientId]);

  const handlePatientFilterChange = (id: string) => {
    setSelectedPatientId(id);
    if (id === 'all') {
      router.push('/records');
    } else {
      router.push(`/records?patientId=${encodeURIComponent(id)}`);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this medical record?')) return;

    try {
      setDeletingId(id);
      const res = await fetch(`/api/records/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRecords((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleResetDemo = async () => {
    if (!confirm('Reset all records back to pristine demo fixtures?')) return;
    try {
      setLoading(true);
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_demo' }),
      });
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
      }
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter records
  const filtered = records.filter((rec) => {
    // Type filter
    if (selectedType !== 'All' && rec.documentType !== selectedType) {
      return false;
    }

    // Abnormal only filter
    const abnormalCount = (rec.observations || []).filter(
      (o) => o.flag === 'HIGH' || o.flag === 'LOW' || o.flag === 'CRITICAL_HIGH' || o.flag === 'CRITICAL_LOW'
    ).length;
    if (onlyAbnormal && abnormalCount === 0) {
      return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchFile = rec.fileName.toLowerCase().includes(q);
      const matchProvider = rec.providerName?.toLowerCase().includes(q);
      const matchType = rec.documentType.toLowerCase().includes(q);
      const matchPatient = (rec.patientNameExtracted || '').toLowerCase().includes(q);
      const matchObs = (rec.observations || []).some((o) => o.testName.toLowerCase().includes(q));
      const matchMed = (rec.medications || []).some((m) => m.medicationName.toLowerCase().includes(q));
      const matchDiag = (rec.diagnoses || []).some((d) => d.conditionName.toLowerCase().includes(q));
      return matchFile || matchProvider || matchType || matchPatient || matchObs || matchMed || matchDiag;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Medical Records Archive
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Search, inspect, and manage digitized clinical documents across registered patients.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDemo}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Demo Data</span>
          </button>

          <Link
            href="/upload"
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Document</span>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by filename, lab test, medication, diagnosis, provider..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Patient Selector */}
          <div className="relative">
            <select
              value={selectedPatientId}
              onChange={(e) => handlePatientFilterChange(e.target.value)}
              className="appearance-none w-full md:w-56 px-3.5 py-2 pr-8 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer shadow-xs"
            >
              <option value="all">All Patients (Aggregate)</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} {p.isDemo ? '[Demo]' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Abnormal Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition shrink-0">
            <input
              type="checkbox"
              checked={onlyAbnormal}
              onChange={(e) => setOnlyAbnormal(e.target.checked)}
              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
            />
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            <span>Only Out-of-Range Flags</span>
          </label>
        </div>

        {/* Document Type Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] shrink-0">
            Type:
          </span>
          {DOC_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg font-medium transition shrink-0 ${
                selectedType === type
                  ? 'bg-teal-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Records List */}
      {loading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="animate-spin w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-slate-500 text-xs font-medium">Loading clinical records archive...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm max-w-lg mx-auto">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No Documents Found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            {searchQuery || selectedType !== 'All' || onlyAbnormal || selectedPatientId !== 'all'
              ? 'No medical records match your current search and filter criteria.'
              : 'You have not uploaded any medical documents yet.'}
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white font-medium text-xs hover:bg-teal-700 transition"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload First Document</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((doc) => {
            const abnormalCount = (doc.observations || []).filter(
              (o) => o.flag === 'HIGH' || o.flag === 'LOW' || o.flag === 'CRITICAL_HIGH' || o.flag === 'CRITICAL_LOW'
            ).length;

            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="space-y-2 max-w-2xl">
                  {/* Badges & Meta */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <DocumentTypeBadge type={doc.documentType} />
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {doc.documentDate || doc.uploadedAt.split('T')[0]}
                    </span>
                    {doc.patientId && (
                      <Link
                        href={`/patients/${encodeURIComponent(doc.patientId)}`}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 font-semibold hover:bg-teal-100 flex items-center gap-1 transition"
                      >
                        <User className="w-3 h-3" />
                        <span>{doc.patientNameExtracted || doc.patientId}</span>
                      </Link>
                    )}
                    {doc.extractionMethod === 'demo_fixture' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                        Demo Fixture
                      </span>
                    )}
                    {doc.extractionMethod === 'ocr_tesseract' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                        OCR Scanned
                      </span>
                    )}
                  </div>

                  {/* Title & Provider */}
                  <div>
                    <h2 className="text-base font-bold text-slate-900 hover:text-teal-600 transition">
                      <Link href={`/records/${doc.id}`}>{doc.fileName}</Link>
                    </h2>
                    {doc.providerName && (
                      <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{doc.providerName}</span>
                      </div>
                    )}
                  </div>

                  {/* Plain Language Preview */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {doc.summary?.summaryEn}
                  </p>

                  {/* Quick stats tags */}
                  <div className="flex items-center gap-3 pt-1 text-xs">
                    {abnormalCount > 0 && (
                      <span className="flex items-center gap-1 font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                        <AlertTriangle className="w-3 h-3" />
                        {abnormalCount} out-of-range
                      </span>
                    )}
                    {(doc.medications || []).length > 0 && (
                      <span className="flex items-center gap-1 font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                        <Pill className="w-3 h-3" />
                        {doc.medications.length} medications
                      </span>
                    )}
                    {(doc.observations || []).length > 0 && (
                      <span className="text-slate-500">
                        {doc.observations.length} observations
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <Link
                    href={`/records/${doc.id}`}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <span>View Report</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={(e) => handleDelete(doc.id, e)}
                    disabled={deletingId === doc.id}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function RecordsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-slate-500 text-sm">
        Loading records archive...
      </div>
    }>
      <RecordsContent />
    </Suspense>
  );
}
