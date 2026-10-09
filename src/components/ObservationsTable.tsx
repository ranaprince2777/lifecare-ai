'use client';

import { ExtractedObservation } from '@/lib/types/medical';
import StatusBadge from './StatusBadge';
import { Info, Check } from 'lucide-react';
import { useState } from 'react';

interface Props {
  observations: ExtractedObservation[];
  onToggleReview?: (index: number) => void;
  editable?: boolean;
}

export default function ObservationsTable({
  observations,
  onToggleReview,
  editable = false,
}: Props) {
  const [activeTooltipIndex, setActiveTooltipIndex] = useState<number | null>(null);

  if (!observations || observations.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
        <p className="text-sm text-slate-500 font-medium">
          No lab test or clinical measurements extracted in this document.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
            <th className="py-3 px-4">Test Name & Category</th>
            <th className="py-3 px-4">Result Value</th>
            <th className="py-3 px-4">Source Reference Range</th>
            <th className="py-3 px-4 text-center">Status Flag</th>
            <th className="py-3 px-4 text-center">Confidence</th>
            {editable && <th className="py-3 px-4 text-right">Review Action</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {observations.map((obs, idx) => {
            const isAbnormal = obs.flag === 'HIGH' || obs.flag === 'LOW' || obs.flag === 'CRITICAL_HIGH' || obs.flag === 'CRITICAL_LOW';

            return (
              <tr
                key={obs.id || `obs-${idx}`}
                className={`hover:bg-slate-50/60 transition ${
                  isAbnormal ? 'bg-red-50/20' : ''
                }`}
              >
                {/* Test name & category */}
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-900">{obs.testName}</div>
                  <div className="text-xs text-slate-500">{obs.category || 'General'}</div>
                </td>

                {/* Result Value & Unit */}
                <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                  <span className={`text-base font-semibold ${isAbnormal ? 'text-red-700' : 'text-slate-900'}`}>
                    {obs.testResultValue}
                  </span>
                  {obs.unit && <span className="ml-1 text-xs text-slate-500 font-normal">{obs.unit}</span>}
                </td>

                {/* Source Reference Range */}
                <td className="py-3.5 px-4 text-slate-600">
                  {obs.referenceRangeRaw ? (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-xs font-medium text-slate-700">
                      <span>{obs.referenceRangeRaw}</span>
                      {obs.unit && <span className="text-slate-400 font-normal">{obs.unit}</span>}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">None reported</span>
                  )}
                </td>

                {/* Flag */}
                <td className="py-3.5 px-4 text-center">
                  <StatusBadge flag={obs.flag} />
                </td>

                {/* Confidence */}
                <td className="py-3.5 px-4 text-center">
                  <div className="relative inline-block">
                    <button
                      type="button"
                      onClick={() => setActiveTooltipIndex(activeTooltipIndex === idx ? null : idx)}
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 font-medium"
                    >
                      <span>{(obs.confidence * 100).toFixed(0)}%</span>
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    {activeTooltipIndex === idx && obs.sourceText && (
                      <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-slate-900 text-white text-xs rounded-lg shadow-lg">
                        <div className="font-semibold text-slate-200 mb-1">Source Snippet:</div>
                        <div className="font-mono text-[11px] text-slate-300 line-clamp-3">
                          &quot;{obs.sourceText}&quot;
                        </div>
                      </div>
                    )}
                  </div>
                </td>

                {/* Editable review action */}
                {editable && (
                  <td className="py-3.5 px-4 text-right">
                    {onToggleReview && (
                      <button
                        onClick={() => onToggleReview(idx)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                          obs.requiresReview
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{obs.requiresReview ? 'Verify' : 'Verified'}</span>
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
