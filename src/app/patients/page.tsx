'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Search,
  FileText,
  Heart,
  ChevronRight,
  UploadCloud,
  AlertCircle,
  X,
  CheckCircle2,
  Tag,
} from 'lucide-react';
import { PatientProfile } from '@/lib/types/medical';

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'real' | 'demo'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('');
  const [contact, setContact] = useState('');
  const [mockAbhaId, setMockAbhaId] = useState('');
  const [chronicConditions, setChronicConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    let ignore = false;
    fetch('/api/patients')
      .then((res) => res.json())
      .then((data) => {
        if (!ignore && data.success && Array.isArray(data.patients)) {
          setPatients(data.patients);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('Failed to load patients', err);
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  const refreshPatients = async () => {
    try {
      const res = await fetch('/api/patients');
      const data = await res.json();
      if (data.success && Array.isArray(data.patients)) {
        setPatients(data.patients);
      }
    } catch (err) {
      console.error('Failed to reload patients', err);
    }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Patient full name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const payload = {
        fullName: name.trim(),
        age: age ? parseInt(age, 10) : undefined,
        gender,
        bloodGroup: bloodGroup.trim() || null,
        contact: contact.trim() || undefined,
        mockAbhaId: mockAbhaId.trim() || undefined,
        chronicConditions: chronicConditions
          ? chronicConditions.split(',').map((c) => c.trim()).filter(Boolean)
          : [],
        allergies: allergies
          ? allergies.split(',').map((a) => a.trim()).filter(Boolean)
          : [],
        isDemo,
      };

      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create patient');
      }

      // Reset form and close modal
      setName('');
      setAge('');
      setGender('Male');
      setBloodGroup('');
      setContact('');
      setMockAbhaId('');
      setChronicConditions('');
      setAllergies('');
      setIsDemo(false);
      setShowAddModal(false);

      await refreshPatients();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create patient';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (patient.mockAbhaId && patient.mockAbhaId.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === 'real') return !patient.isDemo;
    if (filterType === 'demo') return !!patient.isDemo;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Registry</h1>
                <p className="text-sm text-slate-500">
                  Data-driven patient management. Uploaded medical documents are isolated and linked by patient ID.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white font-medium text-sm hover:bg-teal-700 transition shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Patient</span>
            </button>
            <Link
              href="/upload"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-medium text-sm hover:bg-slate-200 transition"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Document</span>
            </Link>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by patient name, ID, or ABHA..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl self-start sm:self-auto text-xs font-medium text-slate-600">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterType === 'all' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'hover:text-slate-900'
              }`}
            >
              All Records ({patients.length})
            </button>
            <button
              onClick={() => setFilterType('real')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterType === 'real' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'hover:text-slate-900'
              }`}
            >
              Real Patients ({patients.filter((p) => !p.isDemo).length})
            </button>
            <button
              onClick={() => setFilterType('demo')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterType === 'demo' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'hover:text-slate-900'
              }`}
            >
              Demo Fixtures ({patients.filter((p) => p.isDemo).length})
            </button>
          </div>
        </div>

        {/* Patients Grid */}
        {loading ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="animate-spin w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-medium">Loading patient directory...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Patients Found</h3>
            <p className="text-sm text-slate-500 mt-1 mb-6">
              {searchQuery
                ? `No patients match "${searchQuery}". Try adjusting your search query.`
                : 'No patients registered in this category. Create your first real patient record.'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white font-medium text-sm hover:bg-teal-700 transition shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register New Patient</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPatients.map((patient) => {
              const isSynthetic = !!patient.isDemo;
              return (
                <div
                  key={patient.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between"
                >
                  <div>
                    {/* Top row: Badges and ID */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isSynthetic ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            Demo Fixture
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Live Patient
                          </span>
                        )}
                        {patient.bloodGroup && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {patient.bloodGroup}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 truncate max-w-[100px]">
                        {patient.id}
                      </span>
                    </div>

                    {/* Patient Name & Demographics */}
                    <h2 className="text-lg font-bold text-slate-900 group-hover:text-teal-600 transition">
                      {patient.fullName}
                    </h2>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 mb-4">
                      {patient.age ? <span>{patient.age} yrs</span> : <span>Age unrecorded</span>}
                      <span>•</span>
                      <span>{patient.gender || 'Not specified'}</span>
                      {patient.mockAbhaId && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-teal-700">ABHA: {patient.mockAbhaId}</span>
                        </>
                      )}
                    </div>

                    {/* Chronic Conditions / Tags */}
                    {patient.chronicConditions && patient.chronicConditions.length > 0 ? (
                      <div className="mb-4">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                          Clinical Conditions
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {patient.chronicConditions.map((cond, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-medium"
                            >
                              {cond}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mb-4 text-xs text-slate-400 italic">No chronic conditions listed</div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                    <Link
                      href={`/patients/${encodeURIComponent(patient.id)}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold text-xs transition"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Records</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href={`/upload?patientId=${encodeURIComponent(patient.id)}`}
                      title="Upload document for this patient"
                      className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                    >
                      <UploadCloud className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Register Patient */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900">Register New Patient</h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreatePatient} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sunita Devi, Ramesh Gupta"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Age (Years)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="125"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="e.g. 45"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Unknown">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Blood Group
                    </label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                    >
                      <option value="">Not Recorded</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      ABHA ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={mockAbhaId}
                      onChange={(e) => setMockAbhaId(e.target.value)}
                      placeholder="e.g. 91-8765-4321-0000"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Contact / Phone (Optional)
                  </label>
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Diagnosed Chronic Conditions (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={chronicConditions}
                    onChange={(e) => setChronicConditions(e.target.value)}
                    placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Known Drug Allergies (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="e.g. Penicillin, Sulfa Drugs"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDemoCheckbox"
                    checked={isDemo}
                    onChange={(e) => setIsDemo(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                  />
                  <label htmlFor="isDemoCheckbox" className="text-xs text-slate-600">
                    Mark as synthetic Demo profile (for mock testing purposes)
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-sm transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700 transition disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creating...' : 'Register Patient'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
