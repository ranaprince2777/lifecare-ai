'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Key,
  Database,
  Languages,
  Shield,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function SettingsPage() {
  const [geminiKey, setGeminiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  const [defaultLang, setDefaultLang] = useState<'en' | 'hi'>('en');
  const [resettingData, setResettingData] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('medimind_gemini_key') || '';
    setGeminiKey(saved);

    const savedLang = localStorage.getItem('medimind_default_lang') as 'en' | 'hi';
    if (savedLang) setDefaultLang(savedLang);
  }, []);

  const handleSaveKey = () => {
    if (geminiKey.trim()) {
      localStorage.setItem('medimind_gemini_key', geminiKey.trim());
      setTestResult({
        success: true,
        message: 'Gemini API key saved in browser storage.',
      });
    } else {
      localStorage.removeItem('medimind_gemini_key');
      setTestResult({
        success: true,
        message: 'Custom key cleared. App will rely on server environment variables if configured.',
      });
    }
  };

  const handleTestConnection = async () => {
    setTestingKey(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/test-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: geminiKey.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || 'Gemini 2.5 Flash connection active and responding!',
        });
      } else {
        setTestResult({
          success: false,
          error: data.error || 'Failed to connect to Gemini API',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network test error';
      setTestResult({ success: false, error: msg });
    } finally {
      setTestingKey(false);
    }
  };

  const handleLanguageChange = (lang: 'en' | 'hi') => {
    setDefaultLang(lang);
    localStorage.setItem('medimind_default_lang', lang);
  };

  const handleResetDemoData = async () => {
    if (!confirm('Are you sure you want to restore the demo dataset? Any documents uploaded in this session will be reset.')) return;
    try {
      setResettingData(true);
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_demo' }),
      });
      if (res.ok) {
        setResetSuccess(true);
        setTimeout(() => setResetSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Reset failed:', err);
    } finally {
      setResettingData(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-teal-600" />
          <span>System Settings & Preferences</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure Gemini AI keys, default summary languages, and database demo mode.
        </p>
      </div>

      {/* 1. Gemini API Key Configuration */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-teal-600" />
              <span>Google Gemini API Configuration</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Powers structured clinical information extraction and plain-language patient summaries.
            </p>
          </div>

          <a
            href="https://aistudio.google.com/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-semibold shrink-0"
          >
            <span>Get Free Key</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="space-y-3 pt-2">
          <label className="block text-xs font-semibold text-slate-700">
            Gemini API Key (Client-Side or Server Override)
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              placeholder="AIzaSy..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full text-xs font-mono pr-20 pl-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleSaveKey}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition shadow-sm"
            >
              Save Key
            </button>

            <button
              type="button"
              disabled={testingKey}
              onClick={handleTestConnection}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5"
            >
              {testingKey ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />}
              <span>{testingKey ? 'Testing Connection...' : 'Test Connection'}</span>
            </button>
          </div>

          {/* Test Status Banner */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div>
                <strong className="font-semibold">
                  {testResult.success ? 'Success: ' : 'Connection Error: '}
                </strong>
                <span>{testResult.message || testResult.error}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Language Preference */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Languages className="w-4 h-4 text-blue-600" />
            <span>Summary Language Preference</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Choose your preferred default language for AI medical explanations.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => handleLanguageChange('en')}
            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition ${
              defaultLang === 'en'
                ? 'bg-teal-50 border-teal-300 text-teal-800'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            English (Standard)
          </button>

          <button
            onClick={() => handleLanguageChange('hi')}
            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition ${
              defaultLang === 'hi'
                ? 'bg-teal-50 border-teal-300 text-teal-800'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            हिंदी (Hindi)
          </button>
        </div>
      </div>

      {/* 3. Persistence & Database Mode */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-600" />
            <span>Database & Storage Architecture</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            MediMind supports dual storage: Cloud Supabase PostgreSQL or zero-config local demo storage.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900">Current Mode:</span>
            <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
              Local File & Synthetic Demo Mode
            </span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            All records persist locally across server restarts in <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">data/records.json</code>. To enable multi-user Supabase cloud storage, configure <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and run the migrations from <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">supabase/schema.sql</code>.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <div>
            <div className="text-xs font-semibold text-slate-900">Reset Demo Data</div>
            <div className="text-[11px] text-slate-500">
              Restores the 4 comprehensive demo medical fixtures (Lab, Prescription, Ultrasound, Discharge).
            </div>
          </div>

          <button
            type="button"
            disabled={resettingData}
            onClick={handleResetDemoData}
            className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resettingData ? 'animate-spin' : ''}`} />
            <span>{resettingData ? 'Resetting...' : 'Restore Demo Data'}</span>
          </button>
        </div>

        {resetSuccess && (
          <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Demo dataset restored successfully!</span>
          </div>
        )}
      </div>

      {/* 4. Privacy & Security Notice */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>Privacy & Data Sovereignty</span>
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          MediMind AI processes documents with safety-first clinical parameters. Uploaded files are evaluated locally, and extracted medical queries sent to Gemini use minimal clinical contexts without personally identifiable tracking.
        </p>
      </div>
    </div>
  );
}
