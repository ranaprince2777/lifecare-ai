import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function bench() {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  const env: Record<string, string> = {};
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      env[trimmed.substring(0, idx).trim()] = trimmed.substring(idx + 1).trim();
    }
  }

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SECRET_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(url, key);

  console.log('--- Testing Lightweight Metric Queries ---');
  const t0 = Date.now();
  const [profilesRes, docsRes, obsRes, medsRes, diagRes] = await Promise.all([
    supabase.from('profiles').select('*'),
    supabase.from('medical_documents').select('id, user_id, file_path, patient_name_extracted, document_date, created_at'),
    supabase.from('extracted_observations').select('document_id, flag').in('flag', ['HIGH', 'LOW', 'CRITICAL_HIGH', 'CRITICAL_LOW']),
    supabase.from('medications').select('document_id, medication_name').eq('is_active', true),
    supabase.from('diagnoses').select('document_id, condition_name'),
  ]);
  console.log('All 5 lightweight queries in parallel took:', Date.now() - t0, 'ms');
  console.log('Profiles:', profilesRes.data?.length, 'Docs:', docsRes.data?.length, 'Abnormal Obs:', obsRes.data?.length, 'Meds:', medsRes.data?.length, 'Diags:', diagRes.data?.length);
}

bench().catch(console.error);
