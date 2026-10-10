'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Clock,
  Calendar,
  Building,
  Search,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  ChevronDown,
  User,
} from 'lucide-react';
import { MedicalDocumentRecord, PatientProfile } from '@/lib/types/medical';
import {
  getCachedPatients,
  setCachedPatients,
  getCachedRecords,
  setCachedRecords,
} from '@/lib/cache/clientCache';
import DocumentTypeBadge from '@/components/DocumentTypeBadge';
import LabTrendsComparison from '@/components/LabTrendsComparison';

function TimelineContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPatientId = searchParams.get('patientId') || 'all';

  const [records, setRecords] = useState<MedicalDocumentRecord[]>(() => getCachedRecords(initialPatientId));
  const [patients, setPatients] = useState<PatientProfile[]>(() => getCachedPatients());
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'timeline' | 'trends'>('timeline');

  // Load patients
  useEffect(() => {
    fetch('/api/patients')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.patients)) {
          setPatients(data.patients);
          setCachedPatients(data.patients);
        }
      })
      .catch((err) => console.error('Failed to load patients for timeline:', err));
  }, []);

  // Load records
  useEffect(() => {
    async function fetchTimeline() {
      try {
        const query = selectedPatientId && selectedPatientId !== 'all' ? `?patientId=${encodeURIComponent(selectedPatientId)}` : '';
        const res = await fetch(`/api/records${query}`);
        if (res.ok) {
          const data = await res.json();
          const recs = data.records || [];
          setRecords(recs);
          setCachedRecords(recs, selectedPatientId);
        }
      } catch (err) {
        console.error('Failed to load timeline records:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTimeline();
  }, [selectedPatientId]);

  const handlePatientFilterChange = (id: string) => {
    setSelectedPatientId(id);
    const cached = getCachedRecords(id);
    if (cached.length > 0) {
      setRecords(cached);
    } else {
      setLoading(true);
    }
    if (id === 'all') {
      router.push('/timeline');
    } else {
      router.push(`/timeline?patientId=${encodeURIComponent(id)}`);
    }
  };

  // Filter and sort records chronologically
  const filteredRecords = records
    .filter((r) => {
      if (selectedType !== 'All' && r.documentType !== selectedType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.fileName.toLowerCase().includes(q) ||
          (r.providerName && r.providerName.toLowerCase().includes(q)) ||
          r.summary?.summaryEn?.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.documentDate || a.uploadedAt).getTime();
      const dateB = new Date(b.documentDate || b.uploadedAt).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title & View Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-teal-600" />
            <span>Chronological Medical Timeline</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Longitudinal health history sorted by clinical report date.
          </p>
        </div>

        {/* View Mode Toggle: Events vs Trends */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveView('timeline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeView === 'timeline'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Event Stream</span>
          </button>
          <button
            onClick={() => setActiveView('trends')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeView === 'trends'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
            <span>Lab Trends ({records.flatMap((r) => r.observations || []).length})</span>
          </button>
        </div>
      </div>

      {/* Patient Selector and Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-xs">
          <select
            value={selectedPatientId}
            onChange={(e) => handlePatientFilterChange(e.target.value)}
            className="appearance-none w-full px-3.5 py-2 pr-8 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer shadow-xs"
          >
            <option value="all">All Patients (Aggregate Timeline)</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName} {p.isDemo ? '[Demo]' : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search timeline..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="relative">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="appearance-none px-3 py-2 pr-7 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            <option value="All">All Types</option>
            <option value="Lab Report">Lab Report</option>
            <option value="Prescription">Prescription</option>
            <option value="Diagnostic Report">Diagnostic Report</option>
            <option value="Discharge Summary">Discharge Summary</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition shrink-0"
          >
            Sort: {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </button>
        </div>
      </div>

      {activeView === 'trends' ? (
        <LabTrendsComparison records={records} />
      ) : (
        <>
          {loading && records.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="animate-spin w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-slate-500 text-xs font-medium">Loading clinical timeline...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm max-w-lg mx-auto">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">No Timeline Records Found</h3>
              <p className="text-xs text-slate-500 mt-1 mb-5">
                Upload medical documents to automatically extract and plot health milestones on this timeline.
              </p>
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white font-medium text-xs hover:bg-teal-700 transition"
              >
                <span>Upload First Document</span>
              </Link>
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 space-y-8 my-4">
              {filteredRecords.map((doc) => {
                const abnormalCount = (doc.observations || []).filter(
                  (o) => o.flag === 'HIGH' || o.flag === 'LOW' || o.flag === 'CRITICAL_HIGH' || o.flag === 'CRITICAL_LOW'
                ).length;

                return (
                  <div key={doc.id} className="relative group">
                    {/* Circle marker on timeline spine */}
                    <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-white border-4 border-teal-600 group-hover:scale-125 transition-transform" />

                    {/* Timeline card */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition space-y-3">
                      {/* Top meta */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <DocumentTypeBadge type={doc.documentType} />
                          <span className="text-xs font-mono font-semibold text-slate-700 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {doc.documentDate || doc.uploadedAt.split('T')[0]}
                          </span>
                        </div>

                        {doc.patientId && (
                          <Link
                            href={`/patients/${encodeURIComponent(doc.patientId)}`}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 font-semibold hover:bg-teal-100 flex items-center gap-1 transition"
                          >
                            <User className="w-3 h-3" />
                            <span>{doc.patientNameExtracted || doc.patientId}</span>
                          </Link>
                        )}
                      </div>

                      {/* Title & Provider */}
                      <div>
                        <h3 className="text-base font-bold text-slate-900 hover:text-teal-600 transition">
                          <Link href={`/records/${doc.id}`}>{doc.fileName}</Link>
                        </h3>
                        {doc.providerName && (
                          <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{doc.providerName}</span>
                          </div>
                        )}
                      </div>

                      {/* Summary */}
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {doc.summary?.summaryEn}
                      </p>

                      {/* Footer & Link */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          {abnormalCount > 0 ? (
                            <span className="text-xs font-semibold text-red-700 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {abnormalCount} flagged
                            </span>
                          ) : (
                            <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Within normal bounds
                            </span>
                          )}
                        </div>

                        <Link
                          href={`/records/${doc.id}`}
                          className="font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                        >
                          <span>Full Report</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function TimelinePage() {
  return (
    <Suspense fallback={
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-slate-500 text-sm">
        Loading timeline...
      </div>
    }>
      <TimelineContent />
    </Suspense>
  );
}
