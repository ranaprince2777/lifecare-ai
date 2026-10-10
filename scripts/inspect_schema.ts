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

async function checkDocs() {
  const { data: docs } = await client
    .from('medical_documents')
    .select('id, file_name, patient_name_extracted, patient_age_extracted, user_id, document_date, created_at');
  console.log('Total docs in Supabase:', docs?.length);
  console.log('Docs summary:', JSON.stringify(docs, null, 2));

  const recordsPath = path.join(process.cwd(), 'data', 'records.json');
  if (fs.existsSync(recordsPath)) {
    const local = JSON.parse(fs.readFileSync(recordsPath, 'utf-8'));
    console.log('Total docs in local records.json:', local.length);
    console.log(
      'Local docs patient names:',
      local.map((d: { id: string; fileName: string; patientNameExtracted?: string; userId?: string }) => ({
        id: d.id,
        file: d.fileName,
        patient: d.patientNameExtracted,
        userId: d.userId,
      }))
    );
  }
}

checkDocs().catch(console.error);
