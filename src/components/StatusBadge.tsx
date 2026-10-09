import { ObservationFlag } from '@/lib/types/medical';
import { ArrowUpRight, ArrowDownRight, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

interface Props {
  flag: ObservationFlag;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ flag, size = 'sm' }: Props) {
  const isSm = size === 'sm';
  const sizeClasses = isSm ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';
  const iconSize = isSm ? 'w-3 h-3' : 'w-4 h-4';

  switch (flag) {
    case 'HIGH':
    case 'CRITICAL_HIGH':
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-md border bg-red-50 text-red-700 border-red-200 ${sizeClasses}`}
        >
          <ArrowUpRight className={iconSize} />
          <span>{flag === 'CRITICAL_HIGH' ? 'Crit High' : 'High'}</span>
        </span>
      );

    case 'LOW':
    case 'CRITICAL_LOW':
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-md border bg-amber-50 text-amber-700 border-amber-200 ${sizeClasses}`}
        >
          <ArrowDownRight className={iconSize} />
          <span>{flag === 'CRITICAL_LOW' ? 'Crit Low' : 'Low'}</span>
        </span>
      );

    case 'NORMAL':
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200 ${sizeClasses}`}
        >
          <CheckCircle2 className={iconSize} />
          <span>Normal</span>
        </span>
      );

    case 'UNCLASSIFIED':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-md border bg-slate-50 text-slate-600 border-slate-200 ${sizeClasses}`}
        >
          <HelpCircle className={iconSize} />
          <span>Unclassified</span>
        </span>
      );
  }
}
