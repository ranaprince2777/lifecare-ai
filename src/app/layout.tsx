import type { Metadata } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'MediMind AI — AI-Powered Personal Health Copilot',
  description:
    'Transform prescriptions, lab reports, diagnostics, and discharge summaries into plain-language summaries, structured observations, and a unified chronological medical timeline.',
};

import { Suspense } from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <Suspense fallback={<div className="h-16 bg-white border-b border-slate-200" />}>
          <Navigation />
        </Suspense>
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
