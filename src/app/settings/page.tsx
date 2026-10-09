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
  Eye,
  EyeOff,
} from 'lucide-react';

export default function SettingsPage() {
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [serverConfigured, setServerConfigured] = useState<boolean | null>(null);
  const [serverKeyLength, setServerKeyLength] = useState<number | null>(null);

  const [savingKey, setSavingKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    model?: string;
  } | null>(null);

  const [defaultLang, setDefaultLang] = useState<'en' | 'hi'>(() => {
    if (typeof window !== 'undefined') {
      const saved = (localStorage.getItem('lifecare_default_lang') || localStorage.getItem('medimind_default_lang')) as 'en' | 'hi';
      if (saved === 'en' || saved === 'hi') return saved;
    }
    return 'en';
  });
  const [resettingData, setResettingData] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [storageStatus, setStorageStatus] = useState<{
    mode: 'local' | 'supabase';
    configured: boolean;
    localRecordsCount: number;
    provider: string;
  } | null>(null);

  // Check server configuration status and purge any legacy client-side localStorage secrets
  const checkServerKeyStatus = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('lifecare_gemini_key');
        localStorage.removeItem('medimind_gemini_key');
      }

      const res = await fetch('/api/settings/key');
      if (res.ok) {
        const data = await res.json();
        setServerConfigured(data.configured);
        setServerKeyLength(data.keyLength || null);
      }
    } catch {
      setServerConfigured(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lifecare_gemini_key');
      localStorage.removeItem('medimind_gemini_key');
    }

    fetch('/api/settings/key')
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) {
          setServerConfigured(Boolean(data.configured));
          setServerKeyLength(data.keyLength || null);
        }
      })
      .catch(() => {
        if (!ignore) setServerConfigured(false);
      });

    fetch('/api/settings/storage')
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) {
          setStorageStatus(data);
        }
      })
      .catch(() => {
        // Keep null fallback
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleSaveKeyToServer = async () => {
    if (!geminiKeyInput.trim()) {
      alert('Please enter a valid Gemini API key.');
      return;
    }

    setSavingKey(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/settings/key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: geminiKeyInput.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setGeminiKeyInput(''); // Clear secret from browser memory
        await checkServerKeyStatus();
        setTestResult({
          success: true,
          message: 'API key saved to server .env.local securely. Secret cleared from browser memory.',
        });
      } else {
        setTestResult({
          success: false,
          error: data.error || 'Failed to save key to server.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setTestResult({ success: false, error: msg });
    } finally {
      setSavingKey(false);
    }
  };

  const handleClearServerKey = async () => {
    if (!confirm('Remove Gemini API key from server .env.local?')) return;
    try {
      const res = await fetch('/api/settings/key', { method: 'DELETE' });
      if (res.ok) {
        await checkServerKeyStatus();
        setTestResult({
          success: true,
          message: 'API key cleared from server .env.local.',
        });
      }
    } catch (err) {
      console.error('Error clearing key:', err);
    }
  };

  const handleTestConnection = async () => {
    setTestingKey(true);
    setTestResult(null);

    try {
      // Test server configured key or test typed input before saving
      const payload = geminiKeyInput.trim() ? { apiKey: geminiKeyInput.trim() } : {};
      const res = await fetch('/api/test-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Automatically persist successfully verified key to server .env.local
        if (geminiKeyInput.trim()) {
          try {
            await fetch('/api/settings/key', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ apiKey: geminiKeyInput.trim() }),
            });
            setGeminiKeyInput(''); // Clear secret from browser memory
            await checkServerKeyStatus();
          } catch (e) {
            console.error('Failed to auto-save key:', e);
          }
        }
        setTestResult({
          success: true,
          message: `${data.message || `Successfully connected to Google Gemini using ${data.model}!`} Verified key saved to .env.local.`,
          model: data.model,
        });
      } else {
        setTestResult({
          success: false,
          error: data.error || 'Failed to connect to Gemini API.',
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
    localStorage.setItem('lifecare_default_lang', lang);
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
          <span>System Settings & Model Configuration</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure Gemini AI models, server environment keys, and bilingual preferences.
        </p>
      </div>

      {/* 1. Gemini API Key & Model Configuration */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-teal-600" />
              <span>Google Gemini Model & Server Key</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Supports <strong className="text-slate-700">gemini-3.1-flash-lite</strong> (primary) with automatic fallback to <strong className="text-slate-700">gemini-3.1-flash</strong>.
            </p>
          </div>

          <a
            href="https://aistudio.google.com/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-semibold shrink-0"
          >
            <span>Google AI Studio</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* AI Service Configuration Status Badge */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${serverConfigured ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {serverConfigured ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">
                  {serverConfigured ? 'AI Service Configured' : 'AI Service Not Configured'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${serverConfigured ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                  {serverConfigured ? 'Active (Server .env.local)' : 'Action Required'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {serverConfigured
                  ? `Google Gemini is permanently configured on the server via GEMINI_API_KEY (${serverKeyLength} chars). Reusable across all document pipelines.`
                  : 'Server environment variable GEMINI_API_KEY is not defined. Please add it to your server .env.local.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={testingKey || !serverConfigured}
            onClick={handleTestConnection}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-semibold transition shadow-sm flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingKey ? 'animate-spin' : ''}`} />
            <span>{testingKey ? 'Testing Connection...' : 'Test Live Connection'}</span>
          </button>
        </div>

        {/* Live Test Status Banner */}
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
            <div className="space-y-0.5">
              <strong className="font-semibold">
                {testResult.success ? 'Connection Verified: ' : 'Connection Check Failed: '}
              </strong>
              <div>{testResult.message || testResult.error}</div>
              {testResult.model && (
                <div className="font-mono text-[11px] text-emerald-700 pt-0.5 font-semibold">
                  Active Model: {testResult.model}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Collapsible Advanced Management */}
        <details className="text-xs text-slate-600 pt-2 border-t border-slate-100 group">
          <summary className="cursor-pointer font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 select-none py-1">
            <span>Advanced: Server Key Management & Manual Override</span>
          </summary>
          <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <p className="text-[11px] text-slate-500">
              Only use this if you need to manually rotate the server-side key stored in <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">.env.local</code>.
            </p>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                placeholder="AIzaSy... (Paste new key to replace server key)"
                value={geminiKeyInput}
                onChange={(e) => setGeminiKeyInput(e.target.value)}
                className="w-full text-xs font-mono pr-20 pl-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={savingKey || !geminiKeyInput.trim()}
                onClick={handleSaveKeyToServer}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold transition"
              >
                {savingKey ? 'Updating...' : 'Update Server Key'}
              </button>
              {serverConfigured && (
                <button
                  type="button"
                  onClick={handleClearServerKey}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 transition"
                >
                  Clear Key
                </button>
              )}
            </div>
          </div>
        </details>
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
            LifeCare AI supports dual storage: Cloud Supabase PostgreSQL or zero-config local demo storage.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900">Current Storage Engine:</span>
            {storageStatus?.configured ? (
              <span className="px-2.5 py-0.5 rounded-full font-bold bg-purple-100 text-purple-800 flex items-center gap-1">
                <span>Supabase Cloud Mode (Mumbai)</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <span>Local JSON Fallback Mode</span>
              </span>
            )}
          </div>
          <p className="text-slate-600 leading-relaxed">
            {storageStatus?.configured ? (
              <>Cloud PostgreSQL database connected with strict Row-Level Security (RLS) policies and private storage bucket.</>
            ) : (
              <>All records persist locally across server restarts in <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">data/records.json</code> ({storageStatus?.localRecordsCount ?? 5} records active). To connect Supabase, see <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">SUPABASE_SETUP.md</code>.</>
            )}
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
          <span>Security & Secret Sovereignty</span>
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          LifeCare AI keeps all API keys strictly server-side in <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">.env.local</code>. No credentials are stored in client localStorage, cookies, or frontend code bundles.
        </p>
      </div>
    </div>
  );
}
