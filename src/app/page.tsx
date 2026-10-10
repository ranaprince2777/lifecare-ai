import Link from 'next/link';
import {
  Activity,
  UploadCloud,
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Languages,
  Stethoscope,
  Pill,
  ArrowRight,
  Layers,
  Sparkles,
  Users,
  GitCompare,
  FileCheck,
  HelpCircle,
  Database,
  Lock,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/70 via-white to-slate-50 border-b border-slate-200 py-12 md:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Context Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100/70 border border-teal-200 text-teal-800 text-xs font-semibold tracking-wide mb-6">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>AI-Powered Personal Health Copilot</span>
            </div>

            {/* Clean, Balanced Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Understand Your Health Reports, <span className="text-teal-600">Simply.</span>
            </h1>

            {/* Focused Product Description */}
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              LifeCare AI helps you organize medical documents, extract important clinical information, and understand complex lab tests, prescriptions, and discharge summaries in simple language.
            </p>

            {/* Balanced Primary Actions */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/upload"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm shadow-xs transition"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Medical Document</span>
              </Link>

              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium text-sm transition"
              >
                <Activity className="w-4 h-4 text-teal-600" />
                <span>Open Patient Dashboard</span>
              </Link>
            </div>

            {/* Spec & Trust Indicators */}
            <div className="mt-8 pt-6 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-500 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                Local & Encrypted Persistence
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-teal-600 shrink-0" />
                PDF & Scanned Image OCR
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-blue-600 shrink-0" />
                English & Hindi Summaries
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-600 shrink-0" />
                HL7 FHIR R4 Standard Export
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights (Compact 6-Item Grid) */}
      <section className="py-12 md:py-16 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Essential Healthcare Intelligence Features
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Purpose-built clinical parsing designed to bring clarity, transparency, and structure to medical records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 1. Medical Document Upload */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-teal-300 hover:shadow-xs transition">
              <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center mb-3.5">
                <UploadCloud className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1.5">
                Medical Document Upload
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Accepts multi-page PDFs and mobile phone images of lab reports, handwritten prescriptions, imaging prints, and discharge summaries.
              </p>
            </div>

            {/* 2. AI-Powered Information Extraction */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-teal-300 hover:shadow-xs transition">
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-3.5">
                <FileCheck className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1.5">
                AI-Powered Information Extraction
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automatically extracts structured clinical data points: specific test names, measured values, units, active medications, dosage regimens, and provider diagnoses.
              </p>
            </div>

            {/* 3. Simple English & Hindi Summaries */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-teal-300 hover:shadow-xs transition">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mb-3.5">
                <Languages className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1.5">
                English & Hindi Summaries
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Translates complicated medical jargon into clear, natural summaries in both English and Hindi Devanagari script while preserving critical drug dosages.
              </p>
            </div>

            {/* 4. Medical Records & Health Timeline */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-teal-300 hover:shadow-xs transition">
              <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center mb-3.5">
                <Clock className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1.5">
                Medical Records & Health Timeline
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Maintains a permanent chronological record of past visits, laboratory reports, and hospitalizations, with instant search and document category filters.
              </p>
            </div>

            {/* 5. Patient Management */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-teal-300 hover:shadow-xs transition">
              <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mb-3.5">
                <Users className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1.5">
                Patient Management
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Register profiles for multiple family members or patients. Every uploaded document is associated with the selected patient and updates their live health metrics.
              </p>
            </div>

            {/* 6. Reference Range Comparison */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-teal-300 hover:shadow-xs transition">
              <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mb-3.5">
                <GitCompare className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1.5">
                Reference Range Comparison
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Evaluates lab values strictly against source reference intervals provided on the report. Flags high, low, and critical observations with deterministic accuracy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How LifeCare AI Works (Upload -> Extract -> Understand -> Organize) */}
      <section className="py-12 md:py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              How LifeCare AI Works
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              A transparent four-step workflow from document ingestion to actionable health understanding.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Step 1 */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 relative">
              <div className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-2">Step 01</div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1.5 flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-teal-600" />
                Upload Document
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Add a PDF report, phone photo, or scan. The pipeline verifies integrity and hashes content to avoid duplicate uploads.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 relative">
              <div className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-2">Step 02</div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1.5 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-teal-600" />
                Extract Information
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dual OCR and clinical structuring parse test panels, reference intervals, medications, doses, and diagnoses into structured records.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 relative">
              <div className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-2">Step 03</div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1.5 flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-teal-600" />
                Understand Plainly
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Review plain-language summaries in English and Hindi, highlighted out-of-range indicators, and suggested questions for your doctor.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 relative">
              <div className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-2">Step 04</div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-600" />
                Organize Chronologically
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Documents are assigned to the selected patient profile, mapped to the health timeline, and available for HL7 FHIR export.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Document Types Supported */}
      <section className="py-12 md:py-16 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Supported Medical Document Categories
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Engineered to handle common routine and hospital healthcare records.
              </p>
            </div>
            <Link
              href="/records"
              className="text-xs sm:text-sm font-semibold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1"
            >
              <span>Explore demo records archive</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-3">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Laboratory Reports</h3>
              <p className="text-xs text-slate-600 mb-2.5">
                CBC, HbA1c, lipid panels, liver function, and kidney profiles with numeric reference range comparisons.
              </p>
              <span className="text-[10px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                Reference Range Highlighting
              </span>
            </div>

            {/* Card 2 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
                <Pill className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Prescriptions</h3>
              <p className="text-xs text-slate-600 mb-2.5">
                Medication names, dosage, frequency, course duration, and provider instructions mapped to active medication lists.
              </p>
              <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                Active Drug Schedule
              </span>
            </div>

            {/* Card 3 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center mb-3">
                <Stethoscope className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Diagnostic Imaging</h3>
              <p className="text-xs text-slate-600 mb-2.5">
                Ultrasounds, chest X-rays, ECGs, and CT scans with radiological findings summarized in accessible language.
              </p>
              <span className="text-[10px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                Radiology Findings Breakdown
              </span>
            </div>

            {/* Card 4 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Discharge Summaries</h3>
              <p className="text-xs text-slate-600 mb-2.5">
                Hospital stays, admitting diagnoses, clinical procedures, inpatient courses, and discharge medications.
              </p>
              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                Hospital Course Recap
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy, Security & Data Ownership */}
      <section className="py-12 md:py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-3">
                <Lock className="w-3.5 h-3.5 text-teal-600" />
                <span>Data Security & Architecture</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                Designed with Privacy and Data Sovereignty in Mind
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                LifeCare AI is engineered to protect user privacy. All credentials and API keys are stored strictly server-side and never exposed to browser client storage. For air-gapped or privacy-conscious deployments, the application supports local file persistence alongside optional encrypted PostgreSQL storage.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 text-teal-600" />
                    Local-First Architecture
                  </div>
                  <p className="text-slate-600">
                    Works offline and locally with zero mandatory cloud databases required.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-teal-600" />
                    Server-Side Secrets
                  </div>
                  <p className="text-slate-600">
                    API keys and AI credentials are never written to client-side localStorage.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    Complete Control
                  </div>
                  <p className="text-slate-600">
                    Delete documents or reset demo data at any time with one click in Settings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prominent Medical Disclaimer */}
      <section className="py-10 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-5">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-amber-950 mb-1">
                  Important Medical Disclaimer
                </h3>
                <p className="text-xs text-amber-900/90 leading-relaxed">
                  LifeCare AI is an assistive digital health literacy tool designed for personal record organization and educational purposes only. It is not a licensed medical device and does not provide clinical diagnoses, medical consultations, prescription modifications, or treatment recommendations. Abnormal value indicators reflect strictly the numeric reference ranges printed on source laboratory reports. Never disregard professional medical advice or delay seeking care because of information displayed in this application.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
