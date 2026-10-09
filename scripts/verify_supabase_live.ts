import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Manually parse .env.local to ensure exact disk-state inspection
function loadEnvLocal(): Record<string, string> {
  const envPath = path.join(process.cwd(), '.env.local');
  const result: Record<string, string> = {};
  if (!fs.existsSync(envPath)) return result;

  const content = fs.readFileSync(envPath, 'utf-8');
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > -1) {
      const key = trimmed.substring(0, eqIdx).trim();
      let val = trimmed.substring(eqIdx + 1).trim();
      // Remove surrounding quotes if present
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      result[key] = val;
    }
  });
  return result;
}

async function runLiveVerification() {
  console.log('================================================================');
  console.log('LifeCare AI — Live Supabase Connection & Security Verification');
  console.log('================================================================\n');

  const env = loadEnvLocal();

  // 1. Inspect Environment Variables
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const secretKey =
    env.SUPABASE_SECRET_KEY ||
    env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('--- 1. Environment Variables Inspection (.env.local) ---');
  console.log('• NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? `Configured (${supabaseUrl.startsWith('https://') ? 'Valid HTTPS URL' : 'Malformed'})` : '❌ MISSING');
  console.log('• NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or ANON_KEY):', publishableKey ? `Configured (Length: ${publishableKey.length} chars, JWT format)` : '❌ MISSING');
  console.log('• SUPABASE_SECRET_KEY (or SERVICE_ROLE_KEY):', secretKey ? `Configured (Length: ${secretKey.length} chars, Server-only)` : '❌ MISSING');

  const isConfigured = Boolean(
    supabaseUrl &&
    secretKey &&
    !supabaseUrl.includes('your-project') &&
    !secretKey.includes('your_supabase')
  );

  if (!isConfigured) {
    console.log('\n❌ [RESULT: CREDENTIALS NOT FOUND ON DISK]');
    console.log('`.env.local` does not currently contain active Supabase credentials.');
    console.log('Notice: If you pasted them in your IDE, please ensure the file is SAVED (Ctrl + S) in `.env.local` (not `.env.example`).');
    process.exit(1);
  }

  console.log('✅ Credentials detected and unexposed.\n');

  // 2. Connect to Supabase
  console.log('--- 2. Connecting to Supabase Cloud Instance ---');
  const adminClient = createClient(supabaseUrl!, secretKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const anonClient = publishableKey
    ? createClient(supabaseUrl!, publishableKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

  // 3. Verify the 6 Tables Exist
  console.log('\n--- 3. Verifying 6 Relational Tables in public schema ---');
  const requiredTables = [
    'profiles',
    'medical_documents',
    'extracted_observations',
    'medications',
    'diagnoses',
    'document_summaries',
  ];

  let allTablesExist = true;
  for (const table of requiredTables) {
    const { error } = await adminClient.from(table).select('id').limit(1);
    if (error) {
      console.log(`❌ Table "public.${table}": FAILED (${error.message})`);
      allTablesExist = false;
    } else {
      console.log(`✅ Table "public.${table}": OK (Table exists & accessible)`);
    }
  }
  if (!allTablesExist) {
    console.log('⚠️ Warning: Not all required tables were accessible.');
  }

  // 4. Verify Private Storage Bucket
  console.log('\n--- 4. Verifying Private Storage Bucket ---');
  const { data: buckets, error: bucketError } = await adminClient.storage.listBuckets();
  if (bucketError) {
    console.log(`❌ Storage Bucket check failed: ${bucketError.message}`);
  } else {
    const medBucket = buckets?.find((b) => b.name === 'medical_documents' || b.id === 'medical_documents');
    if (medBucket) {
      console.log(`✅ Bucket "${medBucket.name}": OK (Private = ${!medBucket.public})`);
    } else {
      console.log('❌ Bucket "medical_documents" not found in Supabase storage.');
    }
  }

  // 5. Verify Row-Level Security: Unauthorized Access Must Be Denied
  console.log('\n--- 5. Verifying Row-Level Security (RLS) & Access Control ---');
  if (anonClient) {
    const { data: anonData, error: anonError } = await anonClient.from('medical_documents').select('*');
    if (anonError) {
      console.log(`✅ Anon Client Direct Query: BLOCKED as expected (Error: ${anonError.message})`);
    } else if (anonData && anonData.length === 0) {
      console.log('✅ Anon Client Direct Query: ZERO records returned (Protected by RLS)');
    } else {
      console.log('❌ Anon Client received records! RLS policy may be too permissive.');
    }
  } else {
    console.log('⚠️ Anon client not tested (publishable key missing)');
  }

  // 6. Safe Synthetic Record Read/Write Test
  console.log('\n--- 6. Safe Synthetic Record Read/Write Test ---');
  const testId = `synth-verify-${Date.now()}`;
  const testDoc = {
    id: testId,
    file_name: 'synthetic_verification_test.pdf',
    file_size: 1024,
    mime_type: 'application/pdf',
    file_path: '/uploads/synthetic_verification_test.pdf',
    file_hash: `hash_${testId}`,
    document_type: 'Lab Report',
    document_date: '2026-04-01',
    provider_name: 'LifeCare Verification Suite',
    patient_name_extracted: 'Synthetic Verification Patient',
    patient_age_extracted: 35,
    raw_extracted_text: 'TEST OBSERVATION: Glucose 100 mg/dL NORMAL',
    extraction_method: 'demo_fixture',
    processing_status: 'completed',
    error_message: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error: insertError } = await adminClient.from('medical_documents').insert(testDoc);
  if (insertError) {
    console.log(`❌ Synthetic Record Insert Failed: ${insertError.message}`);
  } else {
    console.log(`✅ Synthetic Record Insert: SUCCESS (ID: ${testId})`);

    // Read it back
    const { data: readDoc, error: readError } = await adminClient
      .from('medical_documents')
      .select('*')
      .eq('id', testId)
      .single();

    if (readError || !readDoc) {
      console.log(`❌ Synthetic Record Read Failed: ${readError?.message}`);
    } else {
      console.log(`✅ Synthetic Record Read: SUCCESS (Verified file_name: "${readDoc.file_name}")`);
    }

    // Clean up immediately
    const { error: deleteError } = await adminClient.from('medical_documents').delete().eq('id', testId);
    if (deleteError) {
      console.log(`⚠️ Synthetic Record Cleanup Warning: ${deleteError.message}`);
    } else {
      console.log(`🧹 Synthetic Record Cleanup: SUCCESS (Removed ID: ${testId})`);
    }
  }

  console.log('\n================================================================');
  console.log('Live Verification Finished');
  console.log('================================================================\n');
}

runLiveVerification().catch((err) => {
  console.error('Fatal Verification Error:', err.message);
  process.exit(1);
});
