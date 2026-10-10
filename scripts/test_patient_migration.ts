import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.join(process.cwd(), '.env.local');
const content = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
content.split('\n').forEach((line) => {
  const idx = line.indexOf('=');
  if (idx > -1) {
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    env[k] = v;
  }
});

const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY);

async function testPatientSync() {
  console.log('Testing patient creation in Supabase profiles (snake_case columns)...');

  const testPatient = {
    id: 'pat-test-meera',
    user_id: null,
    full_name: 'Meera Nambiar',
    age: 44,
    gender: 'Female',
    blood_group: 'O+',
    mock_abha_id: '42-8192-3041-9921',
    allergies: ['None documented'],
    chronic_conditions: ['Type 2 Diabetes Mellitus', 'Mixed Dyslipidemia'],
    emergency_contact: { name: 'K. Nambiar', relationship: 'Spouse', phone: '+91 98450 12345' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await client.from('profiles').upsert(testPatient, { onConflict: 'id' }).select();
  console.log('Upsert result:', data, 'error:', error);

  // Clean up test patient
  await client.from('profiles').delete().eq('id', 'pat-test-meera');
  console.log('Cleaned up test patient.');
}

testPatientSync().catch(console.error);
