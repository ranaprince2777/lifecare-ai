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

async function check() {
  const { data, error } = await client.from('profiles').select('*');
  console.log('PROFILES:', JSON.stringify(data, null, 2), 'ERROR:', error);
}

check().catch(console.error);
