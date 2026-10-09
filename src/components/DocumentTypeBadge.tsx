import { DocumentType } from '@/lib/types/medical';
import { FileText, Pill, Stethoscope, Bed, FileQuestion } from 'lucide-react';

interface Props {
  type: DocumentType;
}

export default function DocumentTypeBadge({ type }: Props) {
  switch (type) {
    case 'Lab Report':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
          <FileText className="w-3.5 h-3.5 text-teal-600" />
          <span>Lab Report</span>
        </span>
      );
    case 'Prescription':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <Pill className="w-3.5 h-3.5 text-blue-600" />
          <span>Prescription</span>
        </span>
      );
    case 'Diagnostic Report':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
          <Stethoscope className="w-3.5 h-3.5 text-purple-600" />
          <span>Diagnostic</span>
        </span>
      );
    case 'Discharge Summary':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Bed className="w-3.5 h-3.5 text-emerald-600" />
          <span>Discharge Summary</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          <FileQuestion className="w-3.5 h-3.5 text-slate-500" />
          <span>{type}</span>
        </span>
      );
  }
}
