'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import { MedicalDocumentRecord, ObservationFlag } from '@/lib/types/medical';
import StatusBadge from '@/components/StatusBadge';

interface LabTrendsComparisonProps {
  records: MedicalDocumentRecord[];
  className?: string;
}

interface HistoricalDataPoint {
  documentId: string;
  documentDate: string;
  documentName: string;
  valueNumeric: number;
  valueRaw: string;
  unit: string;
  flag: ObservationFlag;
  referenceRangeRaw?: string | null;
  low?: number | null;
  high?: number | null;
}

interface AnalyzedTrend {
  canonicalName: string;
  category: string;
  standardUnit: string;
  dataPoints: HistoricalDataPoint[];
  hasUnitMismatch: boolean;
  mismatchedUnits?: string[];
  latestPoint: HistoricalDataPoint;
  previousPoint?: HistoricalDataPoint;
  delta?: number;
  deltaPercent?: number;
  trendDirection: 'increased' | 'decreased' | 'stable' | 'single';
  clinicalInterpretation: string;
}

// Canonical name normalization dictionary
function normalizeTestName(rawName: string): { canonical: string; category: string } {
  const lower = rawName.toLowerCase().trim();

  if (lower.includes('hba1c') || lower.includes('glycated hemoglobin') || lower.includes('glycosylated')) {
    return { canonical: 'Glycated Hemoglobin (HbA1c)', category: 'Metabolic & Glycemic' };
  }
  if (lower.includes('fasting') && (lower.includes('glucose') || lower.includes('blood sugar') || lower.includes('plasma glucose'))) {
    return { canonical: 'Fasting Blood Glucose', category: 'Metabolic & Glycemic' };
  }
  if ((lower.includes('post prandial') || lower.includes('ppbs')) && lower.includes('glucose')) {
    return { canonical: 'Post-Prandial Glucose', category: 'Metabolic & Glycemic' };
  }
  if (lower.includes('total cholesterol')) {
    return { canonical: 'Total Cholesterol', category: 'Lipid Profile' };
  }
  if (lower.includes('triglyceride')) {
    return { canonical: 'Serum Triglycerides', category: 'Lipid Profile' };
  }
  if (lower.includes('hdl') && lower.includes('cholesterol')) {
    return { canonical: 'HDL Cholesterol', category: 'Lipid Profile' };
  }
  if (lower.includes('ldl') && lower.includes('cholesterol')) {
    return { canonical: 'LDL Cholesterol', category: 'Lipid Profile' };
  }
  if (lower.includes('creatinine')) {
    return { canonical: 'Serum Creatinine', category: 'Renal Function' };
  }
  if (lower.includes('egfr') || lower.includes('estimated gfr')) {
    return { canonical: 'Estimated GFR (eGFR)', category: 'Renal Function' };
  }
  if (lower.includes('hemoglobin') || lower.includes('haemoglobin') || lower.includes('hb')) {
    return { canonical: 'Hemoglobin (Hb)', category: 'Hematology / CBC' };
  }
  if (lower.includes('platelet')) {
    return { canonical: 'Platelet Count', category: 'Hematology / CBC' };
  }
  if (lower.includes('leukocyte') || lower.includes('wbc') || lower.includes('white blood cell')) {
    return { canonical: 'Total Leukocyte Count (WBC)', category: 'Hematology / CBC' };
  }
  if (lower.includes('thyroid') || lower.includes('tsh')) {
    return { canonical: 'Thyroid Stimulating Hormone (TSH)', category: 'Thyroid / Endocrine' };
  }

  // Fallback title-case capitalization
  const title = rawName.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase());
  return { canonical: title, category: 'General Chemistry' };
}

export default function LabTrendsComparison({ records, className = '' }: LabTrendsComparisonProps) {
  // Aggregate and sort observations across all documents
  const analyzedTrends = useMemo(() => {
    const testMap: Map<string, { category: string; points: HistoricalDataPoint[] }> = new Map();

    // Sort documents chronologically (oldest to newest for trend analysis)
    const sortedDocs = [...records].sort((a, b) => {
      const dateA = new Date(a.documentDate || a.uploadedAt).getTime();
      const dateB = new Date(b.documentDate || b.uploadedAt).getTime();
      return dateA - dateB;
    });

    for (const doc of sortedDocs) {
      const docDate = doc.documentDate || doc.uploadedAt.split('T')[0];
      for (const obs of doc.observations) {
        // Only consider observations with valid numeric values for longitudinal trend
        const numericVal = obs.testResultNumeric !== undefined && obs.testResultNumeric !== null
          ? obs.testResultNumeric
          : parseFloat(obs.testResultValue);

        if (isNaN(numericVal)) continue;

        const { canonical, category } = normalizeTestName(obs.testName);
        if (!testMap.has(canonical)) {
          testMap.set(canonical, { category, points: [] });
        }

        testMap.get(canonical)!.points.push({
          documentId: doc.id,
          documentDate: docDate,
          documentName: doc.fileName,
          valueNumeric: numericVal,
          valueRaw: obs.testResultValue,
          unit: (obs.unit || '').trim().toLowerCase(),
          flag: obs.flag,
          referenceRangeRaw: obs.referenceRangeRaw,
          low: obs.referenceRangeLow,
          high: obs.referenceRangeHigh,
        });
      }
    }

    const results: AnalyzedTrend[] = [];

    testMap.forEach((entry, canonicalName) => {
      if (entry.points.length === 0) return;

      // Check unit consistency
      const distinctUnits = Array.from(new Set(entry.points.map((p) => p.unit).filter(Boolean)));
      const hasUnitMismatch = distinctUnits.length > 1;
      const latestPoint = entry.points[entry.points.length - 1];
      const previousPoint = entry.points.length > 1 ? entry.points[entry.points.length - 2] : undefined;

      let delta: number | undefined;
      let deltaPercent: number | undefined;
      let trendDirection: 'increased' | 'decreased' | 'stable' | 'single' = 'single';
      let clinicalInterpretation = '';

      if (previousPoint && !hasUnitMismatch) {
        delta = +(latestPoint.valueNumeric - previousPoint.valueNumeric).toFixed(2);
        deltaPercent = previousPoint.valueNumeric !== 0
          ? +((delta / previousPoint.valueNumeric) * 100).toFixed(1)
          : 0;

        if (Math.abs(delta) < 0.01) {
          trendDirection = 'stable';
          clinicalInterpretation = `Stable compared to ${previousPoint.documentDate} reading.`;
        } else if (delta > 0) {
          trendDirection = 'increased';
          clinicalInterpretation = `Increased by ${delta} ${latestPoint.unit} (+${deltaPercent}%) compared to ${previousPoint.documentDate}.`;
        } else {
          trendDirection = 'decreased';
          clinicalInterpretation = `Decreased by ${Math.abs(delta)} ${latestPoint.unit} (${deltaPercent}%) compared to ${previousPoint.documentDate}.`;
        }
      } else if (hasUnitMismatch) {
        clinicalInterpretation = `Cannot compute historical delta: Units differ across reports (${distinctUnits.join(', ')}).`;
      } else {
        clinicalInterpretation = `Baseline observation on ${latestPoint.documentDate}. Upload subsequent reports to monitor trajectory.`;
      }

      results.push({
        canonicalName,
        category: entry.category,
        standardUnit: distinctUnits[0] || latestPoint.unit,
        dataPoints: entry.points,
        hasUnitMismatch,
        mismatchedUnits: distinctUnits,
        latestPoint,
        previousPoint,
        delta,
        deltaPercent,
        trendDirection,
        clinicalInterpretation,
      });
    });

    // Sort: multi-point observations first, then abnormal flags first, then alphabetical
    return results.sort((a, b) => {
      if (b.dataPoints.length !== a.dataPoints.length) {
        return b.dataPoints.length - a.dataPoints.length;
      }
      const aAbnormal = a.latestPoint.flag !== 'NORMAL';
      const bAbnormal = b.latestPoint.flag !== 'NORMAL';
      if (aAbnormal && !bAbnormal) return -1;
      if (!aAbnormal && bAbnormal) return 1;
      return a.canonicalName.localeCompare(b.canonicalName);
    });
  }, [records]);

  const [selectedCanonical, setSelectedCanonical] = useState<string | null>(
    analyzedTrends.length > 0 ? analyzedTrends[0].canonicalName : null
  );

  const activeTrend = analyzedTrends.find((t) => t.canonicalName === selectedCanonical) || analyzedTrends[0];

  if (analyzedTrends.length === 0) {
    return (
      <div className={`bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2 ${className}`}>
        <Layers className="w-8 h-8 text-slate-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">No Longitudinal Lab Trends Available</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Upload laboratory test reports containing standardized numeric findings to track historical health markers.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">
              Longitudinal Lab Trends & Historical Comparison
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Compares values across chronological records only when test names and measurement units are strictly compatible.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
            {analyzedTrends.length} Tracked Markers
          </span>
        </div>
      </div>

      {/* Test Selection Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {analyzedTrends.map((trend) => {
          const isSelected = (activeTrend?.canonicalName === trend.canonicalName);
          const isAbnormal = trend.latestPoint.flag !== 'NORMAL';

          return (
            <button
              key={trend.canonicalName}
              onClick={() => setSelectedCanonical(trend.canonicalName)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 border ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>{trend.canonicalName}</span>
              {trend.dataPoints.length > 1 && (
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                  isSelected ? 'bg-slate-700 text-slate-100' : 'bg-slate-200 text-slate-800'
                }`}>
                  {trend.dataPoints.length} pts
                </span>
              )}
              {isAbnormal && (
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Trend Detailed Card */}
      {activeTrend && (
        <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-5 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider">
                {activeTrend.category}
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {activeTrend.canonicalName}
              </h3>
              <div className="text-xs text-slate-500 mt-0.5">
                Standard Reference Unit: <code className="font-mono text-slate-800 font-semibold">{activeTrend.standardUnit || 'unspecified'}</code>
              </div>
            </div>

            {/* Current Value Display with Delta */}
            <div className="flex items-center gap-4 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Latest Value</div>
                <div className="text-2xl font-bold font-mono text-slate-900 flex items-baseline gap-1">
                  <span>{activeTrend.latestPoint.valueNumeric}</span>
                  <span className="text-xs font-normal text-slate-500">{activeTrend.latestPoint.unit}</span>
                </div>
              </div>

              <div className="border-l border-slate-200 pl-4">
                <StatusBadge flag={activeTrend.latestPoint.flag} />
              </div>

              {/* Delta Box if >= 2 points */}
              {activeTrend.previousPoint && !activeTrend.hasUnitMismatch && activeTrend.delta !== undefined && (
                <div className="border-l border-slate-200 pl-4">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Net Change</div>
                  <div className="flex items-center gap-1 font-mono text-xs font-bold">
                    {activeTrend.delta > 0 ? (
                      <span className="text-red-600 flex items-center">
                        <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                        +{activeTrend.delta} ({activeTrend.deltaPercent}%)
                      </span>
                    ) : activeTrend.delta < 0 ? (
                      <span className="text-emerald-600 flex items-center">
                        <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                        {activeTrend.delta} ({activeTrend.deltaPercent}%)
                      </span>
                    ) : (
                      <span className="text-slate-500 flex items-center">
                        <Minus className="w-3.5 h-3.5 mr-0.5" />
                        0.0 (Stable)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Unit Incompatibility Warning */}
          {activeTrend.hasUnitMismatch && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-amber-950">Unit Mismatch Detected:</strong> Historical reports recorded values in different units ({activeTrend.mismatchedUnits?.join(' vs ')}). Direct numeric mathematical comparison is suppressed to prevent clinical misinterpretation.
              </div>
            </div>
          )}

          {/* Clinical Interpretation Note */}
          <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200 text-xs text-teal-950 flex items-start gap-2">
            <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <strong>Trend Analysis:</strong> {activeTrend.clinicalInterpretation}
            </div>
          </div>

          {/* Chronological Table of Recorded Values */}
          <div>
            <div className="text-xs font-bold text-slate-900 mb-2.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Chronological Observations ({activeTrend.dataPoints.length})</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-xs">
              {activeTrend.dataPoints.map((point, idx) => {
                const isLatest = idx === activeTrend.dataPoints.length - 1;
                return (
                  <div
                    key={point.documentId + idx}
                    className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isLatest ? 'bg-teal-50/30' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <span>{point.documentDate}</span>
                          {isLatest && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 font-bold">
                              Latest
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">
                          {point.documentName}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:justify-end">
                      <div className="text-right">
                        <div className="font-mono font-bold text-slate-900">
                          {point.valueNumeric} {point.unit}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Ref: {point.referenceRangeRaw || 'N/A'}
                        </div>
                      </div>

                      <StatusBadge flag={point.flag} />

                      <Link
                        href={`/records/${point.documentId}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-slate-100 transition"
                        title="View source document"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
