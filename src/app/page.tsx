import Link from 'next/link';
import {
  Activity,
  UploadCloud,
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Languages,
  Stethoscope,
  Pill,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/60 via-white to-slate-50 border-b border-slate-200 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Altrix Labs Hackathon badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100/80 border border-teal-300 text-teal-800 text-xs font-semibold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Altrix Labs Hackathon Prototype</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              AI-Powered Personal <span className="text-teal-600">Health Copilot</span>
            </h1>

            <p className="mt-5 text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Understand your prescriptions, lab tests, ultrasound scans, and hospital discharge summaries. LifeCare AI transforms scattered medical documents into plain-language explanations, validated clinical data, and a lifelong chronological timeline.
            </p>

            {/* Action CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/upload"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-sm transition"
              >
                <UploadCloud className="w-5 h-5" />
                <span>Upload Medical Document</span>
              </Link>

              <Link
                href="/dashboard"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold shadow-sm transition"
              >
                <Activity className="w-5 h-5 text-teal-600" />
                <span>Open Patient Dashboard</span>
              </Link>
            </div>

            <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Private & Secure Processing
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                PDF & Image OCR Built-In
              </span>
              <span className="flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-blue-600" />
                English & Hindi Summaries
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Workflow Pillars */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              An End-to-End Clinical Document Pipeline
            </h2>
            <p className="mt-3 text-slate-600 text-sm">
              Engineered with deterministic safety checks to prevent hallucinations and provide actionable health literacy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-300 transition">
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">1. Ingestion & Dual OCR</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Extracts text from electronic PDFs using PyMuPDF and pdf-parse, or applies Tesseract.js OCR to scanned prescription photos and imaging prints. Detects unreadable or corrupt documents automatically.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-300 transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">2. Deterministic Range Checks</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Evaluates lab values strictly against reference ranges provided in the source report itself. Flags high and low results without fabricating diagnostic conclusions or guessing missing values.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-300 transition">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">3. Lifelong Timeline & FHIR</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Organizes records in a chronological health timeline. Generates plain-language English and Hindi summaries, tailored questions for your doctor, and standard HL7 FHIR R4 JSON bundles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Document Types Supported */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
            <div>
              <div className="text-xs font-semibold text-teal-700 uppercase tracking-wider mb-1">
                Full Spectrum Coverage
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                All Common Healthcare Documents
              </h2>
            </div>
            <Link
              href="/records"
              className="text-sm font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <span>View pre-loaded demo records</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow transition">
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Laboratory Reports</h3>
              <p className="text-xs text-slate-600 mb-3">
                Complete metabolic panels, lipid profiles, CBCs, HbA1c, and renal function tests with reference intervals.
              </p>
              <span className="text-[11px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                Reference Range Highlighting
              </span>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow transition">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
                <Pill className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Prescriptions</h3>
              <p className="text-xs text-slate-600 mb-3">
                Medication names, dosage, frequency, course duration, doctor instructions, and active treatment tracking.
              </p>
              <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                Active Drug Schedule
              </span>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow transition">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center mb-3">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Diagnostic Imaging</h3>
              <p className="text-xs text-slate-600 mb-3">
                Ultrasound whole abdomen, X-rays, ECGs, and CT scan radiological impressions in plain English.
              </p>
              <span className="text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                Radiology Findings Breakdown
              </span>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow transition">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Discharge Summaries</h3>
              <p className="text-xs text-slate-600 mb-3">
                Inpatient hospital stays, primary admitting diagnoses, clinical course, procedures, and discharge medications.
              </p>
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Hospital Course Recap
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Bonus Features: Hindi, Mock ABHA, FHIR */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-2xl p-8 sm:p-12 shadow-md">
            <div className="max-w-3xl">
              <span className="text-xs uppercase font-bold tracking-wider text-teal-400">
                Inclusive & Interoperable
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold mt-2 mb-4">
                Hindi Translations & HL7 FHIR Standard Export
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                LifeCare AI bridges language barriers with natural Hindi summaries in Devanagari script while safeguarding clinical terms and dosage instructions. For healthcare interoperability, every record can be converted to an HL7 FHIR R4 Bundle containing Patient, DiagnosticReport, Observation, and MedicationStatement resources.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/records/demo-rec-001"
                  className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-sm transition"
                >
                  View Sample Hindi Summary
                </Link>
                <Link
                  href="/timeline"
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition"
                >
                  Explore Interactive Timeline
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
