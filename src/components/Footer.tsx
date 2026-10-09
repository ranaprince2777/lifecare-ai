import Link from 'next/link';
import { Shield, AlertCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Medical and Legal Disclaimer Banner */}
        <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <strong className="font-semibold text-amber-950">Important Clinical Disclaimer:</strong> MediMind AI is an educational tool designed for personal health literacy. It does not provide medical diagnoses, treatment decisions, or drug prescription adjustments. Abnormal value flags reflect only the numeric comparison against reference ranges provided in uploaded reports. Always consult a licensed healthcare professional for clinical advice.
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700">MediMind AI</span>
            <span>•</span>
            <span>Built for Altrix Labs Hackathon</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-teal-700">
              <Shield className="w-3.5 h-3.5" /> Client-Side Privacy Prioritized
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/records" className="hover:text-slate-800 transition">
              Records
            </Link>
            <Link href="/timeline" className="hover:text-slate-800 transition">
              Timeline
            </Link>
            <Link href="/profile" className="hover:text-slate-800 transition">
              Profile
            </Link>
            <Link href="/settings" className="hover:text-slate-800 transition">
              Settings & API Keys
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
