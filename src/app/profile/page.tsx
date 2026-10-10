'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  User,
  Heart,
  Phone,
  Save,
  CheckCircle2,
  Info,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Users,
  ChevronDown,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { PatientProfile } from '@/lib/types/medical';

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedPatientId = searchParams.get('patientId') || '';

  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(requestedPatientId);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedAbha, setCopiedAbha] = useState(false);

  // Load patient list
  useEffect(() => {
    fetch('/api/patients')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.patients)) {
          setPatients(data.patients);
        }
      })
      .catch((err) => console.error('Failed to load patients for profile:', err));
  }, []);

  // Load profile for selected patient or default
  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const query = selectedPatientId ? `?patientId=${encodeURIComponent(selectedPatientId)}` : '';
        const res = await fetch(`/api/profile${query}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
          if (data.profile?.id) {
            setSelectedPatientId(data.profile.id);
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [selectedPatientId]);

  const handlePatientSelectChange = (id: string) => {
    setSelectedPatientId(id);
    router.push(`/profile?patientId=${encodeURIComponent(id)}`);
  };

  const generateMockAbha = () => {
    if (!profile) return;
    const r1 = Math.floor(10 + Math.random() * 89);
    const r2 = Math.floor(1000 + Math.random() * 9000);
    const r3 = Math.floor(1000 + Math.random() * 9000);
    const r4 = Math.floor(1000 + Math.random() * 9000);
    const newId = `${r1}-${r2}-${r3}-${r4}`;
    setProfile({ ...profile, mockAbhaId: newId });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/profile?patientId=${encodeURIComponent(profile.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-slate-200 rounded"></div>
          <div className="h-64 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title & Patient Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <User className="w-6 h-6 text-teal-600" />
            <span>Patient Health Profile</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Demographic baseline, chronic diagnoses, known allergies, and mock ABHA identification.
          </p>
        </div>

        {/* Patient Switcher */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedPatientId}
              onChange={(e) => handlePatientSelectChange(e.target.value)}
              className="appearance-none px-3.5 py-2 pr-8 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-sm"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.isDemo ? '🧪 [Demo] ' : '👤 '}
                  {p.fullName}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <Link
            href="/patients"
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center gap-1"
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>Registry</span>
          </Link>
        </div>
      </div>

      {/* Patient Status Banner */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-xs">
        <div className="flex items-center gap-2">
          {profile.isDemo ? (
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold flex items-center gap-1">
              <Tag className="w-3 h-3" />
              Demo Fixture Profile
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Verified Patient Record
            </span>
          )}
          <span className="font-mono text-slate-500">ID: {profile.id}</span>
        </div>

        <Link
          href={`/patients/${encodeURIComponent(profile.id)}`}
          className="text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"
        >
          <span>View Patient Command Center</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Mock ABHA ID Notice Banner */}
      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="text-xs text-teal-900 leading-relaxed">
          <strong className="font-semibold text-teal-950">ABHA Demonstration Notice:</strong> The ABHA ID displayed below is a mock identifier for hackathon prototyping. In accordance with guidelines, LifeCare AI does not claim official ABDM gateway integration or live national registry verification.
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Section 1: Demographics */}
        <div>
          <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 text-teal-600" />
            <span>Personal & Demographic Information</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Mock ABHA Health ID (ABDM Sandbox)
                </label>
                <button
                  type="button"
                  onClick={generateMockAbha}
                  className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Generate New</span>
                </button>
              </div>

              <div className="relative flex items-center">
                <input
                  type="text"
                  value={profile.mockAbhaId || ''}
                  onChange={(e) => setProfile({ ...profile, mockAbhaId: e.target.value })}
                  className="w-full text-xs font-mono px-3 py-2 pr-16 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 font-bold"
                  placeholder="XX-XXXX-XXXX-XXXX"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (profile.mockAbhaId) {
                      navigator.clipboard.writeText(profile.mockAbhaId);
                      setCopiedAbha(true);
                      setTimeout(() => setCopiedAbha(false), 2000);
                    }
                  }}
                  className="absolute right-2 px-2 py-1 text-[10px] font-semibold rounded bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center gap-1 transition"
                  title="Copy Mock ABHA"
                >
                  {copiedAbha ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedAbha ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                {profile.mockAbhaId && /^\d{2}-\d{4}-\d{4}-\d{4}$/.test(profile.mockAbhaId.trim()) ? (
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Valid 14-digit ABDM Mock Format</span>
                  </span>
                ) : (
                  <span className="text-amber-700 font-medium">
                    Format: 14 digits (e.g. 14-8892-4102-7719)
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Age (Years)</label>
              <input
                type="number"
                value={profile.age || ''}
                onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || 0 })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
              <select
                value={profile.bloodGroup || ''}
                onChange={(e) => setProfile({ ...profile, bloodGroup: e.target.value as PatientProfile['bloodGroup'] })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="">Not Recorded</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Medical Baseline */}
        <div>
          <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-600" />
            <span>Clinical Conditions & Drug Allergies</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Diagnosed Chronic Conditions (Comma-separated)
              </label>
              <input
                type="text"
                value={(profile.chronicConditions || []).join(', ')}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    chronicConditions: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g. Type 2 Diabetes, Hypertension, Dyslipidemia"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Known Drug Allergies (Comma-separated)
              </label>
              <input
                type="text"
                value={(profile.allergies || []).join(', ')}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    allergies: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g. Penicillin, Sulfa drugs"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Emergency Contact */}
        <div>
          <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Phone className="w-4 h-4 text-blue-600" />
            <span>Emergency Contact & Caregiver</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Name</label>
              <input
                type="text"
                value={profile.emergencyContact?.name || ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    emergencyContact: {
                      ...profile.emergencyContact,
                      name: e.target.value,
                      relationship: profile.emergencyContact?.relationship || '',
                      phone: profile.emergencyContact?.phone || '',
                    },
                  })
                }
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Relationship</label>
              <input
                type="text"
                value={profile.emergencyContact?.relationship || ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    emergencyContact: {
                      ...profile.emergencyContact,
                      name: profile.emergencyContact?.name || '',
                      relationship: e.target.value,
                      phone: profile.emergencyContact?.phone || '',
                    },
                  })
                }
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={profile.emergencyContact?.phone || ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    emergencyContact: {
                      ...profile.emergencyContact,
                      name: profile.emergencyContact?.name || '',
                      relationship: profile.emergencyContact?.relationship || '',
                      phone: e.target.value,
                    },
                  })
                }
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            {savedSuccess && (
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Profile updated successfully!</span>
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-slate-500 text-sm">
        Loading patient profile...
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
