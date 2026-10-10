import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-800">LifeCare AI</span>
            <span>•</span>
            <span>Personal Health Copilot</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-teal-700">
              <Shield className="w-3.5 h-3.5" /> Privacy-First Architecture
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link href="/dashboard" className="hover:text-slate-900 transition">
              Dashboard
            </Link>
            <Link href="/patients" className="hover:text-slate-900 transition">
              Patients
            </Link>
            <Link href="/upload" className="hover:text-slate-900 transition">
              Upload
            </Link>
            <Link href="/records" className="hover:text-slate-900 transition">
              Records
            </Link>
            <Link href="/timeline" className="hover:text-slate-900 transition">
              Timeline
            </Link>
            <Link href="/profile" className="hover:text-slate-900 transition">
              Profile
            </Link>
            <Link href="/settings" className="hover:text-slate-900 transition">
              Settings
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
