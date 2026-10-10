'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  FileText,
  UploadCloud,
  Clock,
  User,
  Users,
  Settings,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Activity },
    { href: '/patients', label: 'Patients', icon: Users },
    { href: '/upload', label: 'Upload Document', icon: UploadCloud },
    { href: '/records', label: 'Medical Records', icon: FileText },
    { href: '/timeline', label: 'Health Timeline', icon: Clock },
    { href: '/profile', label: 'Health Profile', icon: User },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') return true;
    if (path !== '/dashboard' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm group-hover:bg-teal-700 transition">
                <Activity className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg text-slate-900 tracking-tight">LifeCare</span>
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                    AI
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Personal Health Copilot</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      active
                        ? 'bg-teal-50 text-teal-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-teal-600' : 'text-slate-400'}`} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Controls: Demo Mode Tag & Upload CTA */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Demo Mode Ready</span>
            </div>

            <Link
              href="/upload"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition shadow-sm"
            >
              <UploadCloud className="w-4 h-4" />
              <span>New Document</span>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                  active
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-teal-600' : 'text-slate-400'}`} />
                {link.label}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Single-User Demo Mode</span>
            <Link
              href="/upload"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-1.5 rounded-md bg-teal-600 text-white text-xs font-medium"
            >
              Upload Doc
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
