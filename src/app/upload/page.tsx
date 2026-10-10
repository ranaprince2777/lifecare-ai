'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  FileCheck,
  Languages,
  Sparkles,
  Key,
  Users,
  UserCheck,
} from 'lucide-react';
import { MedicalDocumentRecord, PatientProfile } from '@/lib/types/medical';
import ObservationsTable from '@/components/ObservationsTable';
import DocumentTypeBadge from '@/components/DocumentTypeBadge';

type ProcessingStep = 'idle' | 'validating' | 'extracting' | 'structuring' | 'saving' | 'done' | 'error';

function UploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId') || 'auto';

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [generateHindi, setGenerateHindi] = useState(true);
  const [step, setStep] = useState<ProcessingStep>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [duplicateDocId, setDuplicateDocId] = useState<string | null>(null);
  const [processedRecord, setProcessedRecord] = useState<MedicalDocumentRecord | null>(null);
  const [aiWarning, setAiWarning] = useState<string | null>(null);
  const [serverKeyConfigured, setServerKeyConfigured] = useState<boolean | null>(null);

  // Patient Registry State
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(preselectedPatientId);

  useEffect(() => {
    // Purge legacy client-side storage for security
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lifecare_gemini_key');
      localStorage.removeItem('medimind_gemini_key');
    }

    // Check server key configuration status
    fetch('/api/settings/key')
      .then((res) => res.json())
      .then((data) => setServerKeyConfigured(Boolean(data?.configured)))
      .catch(() => setServerKeyConfigured(false));

    // Load available patients for document association
    fetch('/api/patients')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.patients)) {
          setPatients(data.patients);
        }
      })
      .catch((err) => console.error('Failed to load patients list:', err));
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    setErrorMessage(null);
    setDuplicateDocId(null);
    setAiWarning(null);
    setProcessedRecord(null);

    // Client-side quick check
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type.toLowerCase()) && !file.name.match(/\.(pdf|jpe?g|png)$/i)) {
      setErrorMessage('Unsupported file format. Please upload a PDF, JPG, JPEG, or PNG document.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 10 MB.`);
      return;
    }

    setSelectedFile(file);
    setStep('idle');
  };

  const startUploadPipeline = async () => {
    if (!selectedFile) return;

    setErrorMessage(null);
    setDuplicateDocId(null);
    setAiWarning(null);

    try {
      setStep('validating');
      setStatusMessage('Validating document signature and checking duplicate hash...');

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('generateHindi', generateHindi ? 'true' : 'false');

      if (selectedPatientId && selectedPatientId !== 'auto') {
        formData.append('patientId', selectedPatientId);
      }

      setStep('extracting');
      setStatusMessage(
        selectedFile.type === 'application/pdf'
          ? 'Extracting embedded digital text (PyMuPDF / pdf-parse)...'
          : 'Performing OCR character recognition (Tesseract.js)...'
      );

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409 && data.isDuplicate) {
          setDuplicateDocId(data.existingRecordId);
          throw new Error(data.error);
        }
        throw new Error(data.error || 'Failed to process document');
      }

      setStep('structuring');
      setStatusMessage('Structuring medical observations and generating plain-language summary...');

      setStep('done');
      setProcessedRecord(data.record);

      if (data.warning) {
        setAiWarning(data.warning);
      }
    } catch (err: unknown) {
      setStep('error');
      const msg = err instanceof Error ? err.message : 'Unknown processing error';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Upload Medical Document
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Upload prescriptions, laboratory reports, ultrasound/radiology impressions, or discharge summaries.
        </p>
      </div>

      {/* Main Upload Box */}
      {step !== 'done' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          {/* Patient Association Selector */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800">
                  Associate With Patient
                </label>
                <p className="text-[11px] text-slate-500">
                  Select an existing patient or let the pipeline match by extracted patient name.
                </p>
              </div>
            </div>

            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
            >
              <option value="auto">⚡ Auto-Detect / Match by Document Name</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.isDemo ? '🧪 [Demo] ' : '👤 '}
                  {p.fullName} ({p.id})
                </option>
              ))}
            </select>
          </div>

          {/* Drag & Drop Target Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition ${
              dragActive
                ? 'border-teal-500 bg-teal-50/50'
                : selectedFile
                ? 'border-emerald-400 bg-emerald-50/20'
                : 'border-slate-300 hover:border-teal-400 hover:bg-slate-50/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/png,image/jpeg"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelection(e.target.files[0]);
                }
              }}
            />

            <div className="flex flex-col items-center justify-center space-y-3">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  selectedFile
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-teal-50 text-teal-600'
                }`}
              >
                {selectedFile ? <FileCheck className="w-7 h-7" /> : <UploadCloud className="w-7 h-7" />}
              </div>

              {selectedFile ? (
                <div className="space-y-1">
                  <div className="text-base font-bold text-slate-900">{selectedFile.name}</div>
                  <div className="text-xs text-slate-500 font-medium">
                    {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Document'}
                  </div>
                  <div className="text-xs text-emerald-700 font-semibold pt-1">
                    Ready to process. Click below to start pipeline.
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-base font-semibold text-slate-900">
                    Drag and drop your medical file here, or <span className="text-teal-600 underline">browse</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Supports PDF, JPG, JPEG, and PNG (up to 10 MB)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Options: Hindi translation & Gemini API Key */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100 text-sm">
            <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 font-medium text-xs select-none">
              <input
                type="checkbox"
                checked={generateHindi}
                onChange={(e) => setGenerateHindi(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
              />
              <Languages className="w-4 h-4 text-blue-600" />
              <span>Generate bilingual summary (English & Hindi)</span>
            </label>

            <a
              href="/settings"
              className="text-xs text-slate-600 hover:text-teal-700 flex items-center gap-1.5 self-start sm:self-auto font-medium"
            >
              <Key className="w-3.5 h-3.5 text-teal-600" />
              <span>
                {serverKeyConfigured
                  ? 'AI Service Configured (Server) ✓'
                  : 'AI Service Not Configured →'}
              </span>
            </a>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-red-900">
                <ShieldAlert className="w-4 h-4" />
                <span>Upload Issue</span>
              </div>
              <p>{errorMessage}</p>

              {duplicateDocId && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => router.push(`/records/${duplicateDocId}`)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-900 font-semibold text-xs transition"
                  >
                    <span>Open existing record</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Processing Progress Status */}
          {step !== 'idle' && step !== 'error' && (
            <div className="p-5 rounded-xl bg-teal-50 border border-teal-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-teal-900">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-teal-600 animate-spin" />
                  <span>Processing Document...</span>
                </div>
                <span className="capitalize">{step}</span>
              </div>

              <div className="w-full bg-teal-200/60 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                  style={{
                    width:
                      step === 'validating'
                        ? '25%'
                        : step === 'extracting'
                        ? '50%'
                        : step === 'structuring'
                        ? '80%'
                        : '100%',
                  }}
                ></div>
              </div>

              <div className="text-xs text-teal-800 font-medium">{statusMessage}</div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {selectedFile && (
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setErrorMessage(null);
                  setStep('idle');
                }}
                disabled={step !== 'idle' && step !== 'error'}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
              >
                Clear
              </button>
            )}

            <button
              type="button"
              disabled={!selectedFile || (step !== 'idle' && step !== 'error')}
              onClick={startUploadPipeline}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition flex items-center gap-2"
            >
              {step !== 'idle' && step !== 'error' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Process Document</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Done State: Immediate Side-by-Side Review */}
      {step === 'done' && processedRecord && (
        <div className="space-y-6">
          {/* Success Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base font-bold text-emerald-950">
                  Document Processed Successfully!
                </h2>
                <div className="flex items-center gap-2 flex-wrap text-xs text-emerald-800 mt-0.5">
                  <span>Extracted and saved as <strong className="text-emerald-950">{processedRecord.documentType}</strong>.</span>
                  {processedRecord.patientId && (
                    <span className="px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-900 font-mono text-[11px] font-semibold flex items-center gap-1">
                      <UserCheck className="w-3 h-3" />
                      Patient: {processedRecord.patientNameExtracted || processedRecord.patientId}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {processedRecord.patientId && (
                <button
                  type="button"
                  onClick={() => router.push(`/patients/${encodeURIComponent(processedRecord.patientId!)}`)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>View Patient Records</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setProcessedRecord(null);
                  setStep('idle');
                }}
                className="px-4 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition"
              >
                Upload Another
              </button>
              <button
                type="button"
                onClick={() => router.push(`/records/${processedRecord.id}`)}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
              >
                <span>Open Full Report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* AI Warning if key missing */}
          {aiWarning && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-amber-950">Text Extracted, Live AI Notice: </strong>
                {aiWarning}
              </div>
            </div>
          )}

          {/* Extracted Summary Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DocumentTypeBadge type={processedRecord.documentType} />
                <span className="text-xs font-semibold text-slate-700">
                  {processedRecord.fileName}
                </span>
              </div>
              <span className="text-xs text-slate-500">
                Method: {processedRecord.extractionMethod}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
              <div className="font-bold text-slate-900 mb-1">Plain-Language Summary:</div>
              <p>{processedRecord.summary.summaryEn}</p>
            </div>

            {/* Observations Table Preview */}
            {processedRecord.observations.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-slate-900">
                  Extracted Lab Observations ({processedRecord.observations.length}):
                </div>
                <ObservationsTable observations={processedRecord.observations} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-slate-500 text-sm">
        Loading upload interface...
      </div>
    }>
      <UploadContent />
    </Suspense>
  );
}
