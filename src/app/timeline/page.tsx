'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  Calendar,
  Building,
  Filter,
  Search,
  AlertTriangle,
  Pill,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import { MedicalDocumentRecord, DocumentType } from '@/lib/types/medical';
import DocumentTypeBadge from '@/components/DocumentTypeBadge';

export default function TimelinePage() {
  const [records, setRecords] = useState<MedicalDocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchTimeline() {
      try {
        setLoading(true);
        const res = await fetch('/api/records');
        if (res.ok) {
          const data = await res.json();
          setRecords(data.records || []);
        }
      } catch (err) {
        console.error('Failed to load timeline records:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTimeline();
  }, []);

  // Filter and sort records chronologically
  const filteredRecords = records
    .filter((r) => {
      if (selectedType !== 'All' && r.documentType !== selectedType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.fileName.toLowerCase().includes(q) ||
          (r.providerName && r.providerName.toLowerCase().includes(q)) ||
          r.summary.summaryEn.toLowerCase().includes(q)
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
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-teal-600" />
            <span>Chronological Medical Timeline</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Your longitudinal health story sorted by document and clinical event date.
          </p>
        </div>

        {/* Sort Order Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
          >
            Sort: {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search timeline events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
          />
        </div>

        {/* Document Type Dropdown / Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Lab Report', 'Prescription', 'Diagnostic Report', 'Discharge Summary'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedType === type
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Stream */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white p-6 rounded-2xl border border-slate-200 h-36"></div>
          ))}
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
          <Clock className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No events found in timeline</h3>
          <p className="text-xs text-slate-500">Try clearing filters or search query.</p>
        </div>
      ) : (
        <div className="relative border-l-2 border-teal-200 ml-4 sm:ml-8 space-y-8 pl-6 sm:pl-8">
          {filteredRecords.map((item, idx) => {
            const abnormalCount = item.observations.filter(
              (o) => o.flag === 'HIGH' || o.flag === 'LOW' || o.flag === 'CRITICAL_HIGH' || o.flag === 'CRITICAL_LOW'
            ).length;

            const isUsingDocDate = Boolean(item.documentDate);
            const displayDate = item.documentDate || item.uploadedAt.split('T')[0];

            return (
              <div key={item.id} className="relative group">
                {/* Timeline node icon */}
                <div className="absolute -left-[33px] sm:-left-[41px] top-1.5 w-6 h-6 rounded-full bg-white border-2 border-teal-600 flex items-center justify-center text-teal-600 shadow-sm group-hover:bg-teal-600 group-hover:text-white transition">
                  <div className="w-2 h-2 rounded-full bg-teal-600 group-hover:bg-white"></div>
                </div>

                {/* Event Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition space-y-3">
                  {/* Top Bar: Date & Type */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <DocumentTypeBadge type={item.documentType} />
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" />
                        <span>{displayDate}</span>
                      </span>
                      {!isUsingDocDate && (
                        <span className="text-[10px] text-slate-400 italic">
                          (fallback to upload date)
                        </span>
                      )}
                    </div>

                    {item.extractionMethod === 'demo_fixture' && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        Demo Fixture
                      </span>
                    )}
                  </div>

                  {/* Title & Clinic */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      <Link href={`/records/${item.id}`} className="hover:text-teal-600 transition">
                        {item.fileName}
                      </Link>
                    </h3>
                    {item.providerName && (
                      <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.providerName}</span>
                      </div>
                    )}
                  </div>

                  {/* Summary preview */}
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {item.summary.summaryEn}
                  </p>

                  {/* Highlights Pill Badges & Action Links */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-3">
                      {abnormalCount > 0 ? (
                        <span className="font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {abnormalCount} out-of-range findings
                        </span>
                      ) : (
                        <span className="font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Within reference bounds
                        </span>
                      )}

                      {item.medications.length > 0 && (
                        <span className="text-blue-700 font-medium">
                          {item.medications.length} meds prescribed
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 font-semibold text-teal-600">
                      {item.filePath && (
                        <a
                          href={item.filePath}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline flex items-center gap-1 text-slate-500 hover:text-slate-700 font-normal"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Original File</span>
                        </a>
                      )}
                      <Link
                        href={`/records/${item.id}`}
                        className="hover:text-teal-700 flex items-center gap-1"
                      >
                        <span>View Report</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
