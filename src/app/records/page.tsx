'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Filter,
  Calendar,
  Building,
  AlertTriangle,
  Pill,
  Trash2,
  RefreshCw,
  UploadCloud,
  ArrowRight,
} from 'lucide-react';
import { MedicalDocumentRecord, DocumentType } from '@/lib/types/medical';
import DocumentTypeBadge from '@/components/DocumentTypeBadge';

const DOC_TYPES: Array<'All' | DocumentType> = [
  'All',
  'Lab Report',
  'Prescription',
  'Diagnostic Report',
  'Discharge Summary',
];

export default function RecordsPage() {
  const [records, setRecords] = useState<MedicalDocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'All' | DocumentType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyAbnormal, setOnlyAbnormal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch('/api/records')
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
  }, []);

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
    const abnormalCount = rec.observations.filter(
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
      const matchObs = rec.observations.some((o) => o.testName.toLowerCase().includes(q));
      const matchMed = rec.medications.some((m) => m.medicationName.toLowerCase().includes(q));
      const matchDiag = rec.diagnoses.some((d) => d.conditionName.toLowerCase().includes(q));
      return matchFile || matchProvider || matchType || matchObs || matchMed || matchDiag;
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
            Search, inspect, and manage all your digitized clinical documents.
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

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by document name, clinic, test (e.g. Glucose), medication, or diagnosis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Type:
            </span>
            {DOC_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  selectedType === type
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium select-none">
            <input
              type="checkbox"
              checked={onlyAbnormal}
              onChange={(e) => setOnlyAbnormal(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-red-600 focus:ring-red-500 border-slate-300"
            />
            <span className="text-red-700 font-semibold">Only Out-of-Range Reports</span>
          </label>
        </div>
      </div>

      {/* Records Count & Status */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>Showing {filtered.length} of {records.length} records</span>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white p-6 rounded-2xl border border-slate-200 h-32"></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No medical records match your criteria</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search query, clearing filters, or upload a new medical document.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setSelectedType('All');
                setSearchQuery('');
                setOnlyAbnormal(false);
              }}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Clear Filters
            </button>
            <Link
              href="/upload"
              className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700"
            >
              Upload New Document
            </Link>
          </div>
        </div>
      ) : (
        /* Records List */
        <div className="space-y-4">
          {filtered.map((doc) => {
            const abnormalCount = doc.observations.filter(
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
                    {doc.summary.summaryEn}
                  </p>

                  {/* Quick stats tags */}
                  <div className="flex items-center gap-3 pt-1 text-xs">
                    {abnormalCount > 0 && (
                      <span className="flex items-center gap-1 font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                        <AlertTriangle className="w-3 h-3" />
                        {abnormalCount} out-of-range
                      </span>
                    )}
                    {doc.medications.length > 0 && (
                      <span className="flex items-center gap-1 font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                        <Pill className="w-3 h-3" />
                        {doc.medications.length} medications
                      </span>
                    )}
                    {doc.observations.length > 0 && (
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
