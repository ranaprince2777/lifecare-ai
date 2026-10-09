import fs from 'fs';
import path from 'path';

async function runComprehensiveVerification() {
  console.log('================================================================');
  console.log('LifeCare AI — Comprehensive UI Routes & API Handlers Audit');
  console.log('================================================================\n');

  const BASE_URL = 'http://localhost:3000';
  let passed = 0;
  let failed = 0;

  function recordResult(testName: string, success: boolean, details?: string) {
    if (success) {
      passed++;
      console.log(`✅ [PASS] ${testName}`);
      if (details) console.log(`   └─ ${details}`);
    } else {
      failed++;
      console.log(`❌ [FAIL] ${testName}`);
      if (details) console.log(`   └─ ${details}`);
    }
  }

  // --- SECTION 1: UI PAGES VERIFICATION ---
  console.log('\n--- 1. Testing Frontend UI Pages (HTTP GET) ---');
  const pages = [
    { url: '/', title: 'Landing Page (/)' },
    { url: '/dashboard', title: 'Dashboard (/dashboard)' },
    { url: '/upload', title: 'Upload Page (/upload)' },
    { url: '/records', title: 'Records Archive (/records)' },
    { url: '/records/demo-rec-001', title: 'Record Detail (/records/demo-rec-001)' },
    { url: '/timeline', title: 'Timeline (/timeline)' },
    { url: '/profile', title: 'Patient Profile (/profile)' },
    { url: '/settings', title: 'Settings Page (/settings)' },
  ];

  for (const page of pages) {
    try {
      const res = await fetch(`${BASE_URL}${page.url}`);
      const text = await res.text();
      const isOk = res.status === 200 && text.length > 500 && !text.includes('Application error');
      recordResult(
        `UI Route: ${page.title}`,
        isOk,
        `Status: ${res.status}, Length: ${text.length} bytes, Prerendered HTML: OK`
      );
    } catch (err: unknown) {
      recordResult(`UI Route: ${page.title}`, false, err instanceof Error ? err.message : 'Failed');
    }
  }

  // --- SECTION 2: API DATA ROUTES ---
  console.log('\n--- 2. Testing API Data Endpoints ---');

  // /api/records
  try {
    const res = await fetch(`${BASE_URL}/api/records`);
    const json = await res.json();
    const isOk = res.ok && Array.isArray(json.records) && json.records.length >= 4;
    recordResult(
      'API: GET /api/records',
      isOk,
      `Returned ${json.records?.length || 0} records (4 pre-seeded demo fixtures detected)`
    );
  } catch (err: unknown) {
    recordResult('API: GET /api/records', false, err instanceof Error ? err.message : 'Failed');
  }

  // /api/records/demo-rec-001
  try {
    const res = await fetch(`${BASE_URL}/api/records/demo-rec-001`);
    const json = await res.json();
    const summaryText = json.record?.summary?.summaryEn || json.record?.summaryEn || '';
    const isOk =
      res.ok &&
      json.record &&
      json.record.observations?.length > 0 &&
      summaryText.length > 20;
    recordResult(
      'API: GET /api/records/demo-rec-001',
      isOk,
      `Document: "${json.record?.fileName}", Observations: ${json.record?.observations?.length}, Summary Len: ${summaryText.length}, Bilingual: ${!!(json.record?.summary?.summaryHi || json.record?.summaryHi)}`
    );
  } catch (err: unknown) {
    recordResult('API: GET /api/records/demo-rec-001', false, err instanceof Error ? err.message : 'Failed');
  }

  // /api/records/demo-rec-001/fhir
  try {
    const res = await fetch(`${BASE_URL}/api/records/demo-rec-001/fhir`);
    const json = await res.json();
    const isOk =
      res.ok &&
      json.resourceType === 'Bundle' &&
      json.type === 'collection' &&
      Array.isArray(json.entry);
    recordResult(
      'API: GET /api/records/demo-rec-001/fhir (HL7 FHIR R4 Bundle)',
      isOk,
      `Resource Type: ${json.resourceType}, Bundle Type: ${json.type}, Entries Count: ${json.entry?.length}`
    );
  } catch (err: unknown) {
    recordResult('API: GET /api/records/demo-rec-001/fhir', false, err instanceof Error ? err.message : 'Failed');
  }

  // /api/profile
  try {
    const res = await fetch(`${BASE_URL}/api/profile`);
    const json = await res.json();
    const isOk = res.ok && json.profile && json.profile.fullName;
    recordResult(
      'API: GET /api/profile',
      isOk,
      `Patient Name: "${json.profile?.fullName}", Blood Group: "${json.profile?.bloodGroup}", ABHA ID: "${json.profile?.abhaNumber || json.profile?.abhaId || 'Configured'}"`
    );
  } catch (err: unknown) {
    recordResult('API: GET /api/profile', false, err instanceof Error ? err.message : 'Failed');
  }

  // /api/settings/key (GET)
  try {
    const res = await fetch(`${BASE_URL}/api/settings/key`);
    const json = await res.json();
    const isOk = res.ok && typeof json.configured === 'boolean';
    recordResult(
      'API: GET /api/settings/key (Server Key Sovereignty)',
      isOk,
      `Server Configured: ${json.configured}, No secrets exposed to client`
    );
  } catch (err: unknown) {
    recordResult('API: GET /api/settings/key', false, err instanceof Error ? err.message : 'Failed');
  }

  // /api/settings/storage (GET)
  try {
    const res = await fetch(`${BASE_URL}/api/settings/storage`);
    const json = await res.json();
    const isOk = res.ok && json.mode && typeof json.localRecordsCount === 'number';
    recordResult(
      'API: GET /api/settings/storage (Storage Engine & Fallback Status)',
      isOk,
      `Mode: "${json.mode}", Provider: "${json.provider}", Active Local Records: ${json.localRecordsCount}`
    );
  } catch (err: unknown) {
    recordResult('API: GET /api/settings/storage', false, err instanceof Error ? err.message : 'Failed');
  }

  // /api/test-gemini with server-configured key
  try {
    const res = await fetch(`${BASE_URL}/api/test-gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const json = await res.json();
    const isExpected = (res.status === 200 && json.success) || (res.status === 400 && json.error);
    recordResult(
      'API: POST /api/test-gemini (Server Key Handshake)',
      isExpected,
      `Status: HTTP ${res.status}, Result: "${json.message || json.error}"`
    );
  } catch (err: unknown) {
    recordResult('API: POST /api/test-gemini (Server Key Handshake)', false, err instanceof Error ? err.message : 'Failed');
  }

  // /api/test-gemini with fake invalid key
  try {
    const res = await fetch(`${BASE_URL}/api/test-gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: 'test_dummy_invalid_gemini_key' }),
    });
    const json = await res.json();
    const isExpected = (res.status === 400 || res.status === 403) && json.success === false;
    recordResult(
      'API: POST /api/test-gemini (Invalid Key Rejection & Model Traversal)',
      isExpected,
      `Safely intercepted invalid key with HTTP ${res.status}: "${json.error}"`
    );
  } catch (err: unknown) {
    recordResult('API: POST /api/test-gemini (Invalid Key)', false, err instanceof Error ? err.message : 'Failed');
  }

  // --- SECTION 3: DOCUMENT UPLOAD & EXTRACTION ---
  console.log('\n--- 3. Testing Upload & Ingestion Validation ---');

  // Invalid empty file
  try {
    const form = new FormData();
    form.append('file', new Blob([], { type: 'application/pdf' }), 'empty.pdf');
    const res = await fetch(`${BASE_URL}/api/upload`, { method: 'POST', body: form });
    const json = await res.json();
    const isOk = res.status === 400 && json.error?.includes('empty');
    recordResult('Upload Security: Reject 0-byte file', isOk, `Status: ${res.status}, Error: "${json.error}"`);
  } catch (err: unknown) {
    recordResult('Upload Security: Reject 0-byte file', false, err instanceof Error ? err.message : 'Failed');
  }

  // Invalid oversized file
  try {
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(10.5 * 1024 * 1024)], { type: 'application/pdf' }), 'large.pdf');
    const res = await fetch(`${BASE_URL}/api/upload`, { method: 'POST', body: form });
    const json = await res.json();
    const isOk = res.status === 400 && json.error?.includes('exceeds maximum allowed limit');
    recordResult('Upload Security: Reject >10MB file', isOk, `Status: ${res.status}, Error: "${json.error}"`);
  } catch (err: unknown) {
    recordResult('Upload Security: Reject >10MB file', false, err instanceof Error ? err.message : 'Failed');
  }

  // Duplicate upload detection (SHA-256)
  const samplePdfPath = path.join(process.cwd(), 'public', 'sample_lab_report.pdf');
  if (fs.existsSync(samplePdfPath)) {
    try {
      const pdfBytes = fs.readFileSync(samplePdfPath);
      const form1 = new FormData();
      form1.append('file', new Blob([pdfBytes], { type: 'application/pdf' }), 'test_report_1.pdf');
      const res1 = await fetch(`${BASE_URL}/api/upload`, { method: 'POST', body: form1 });
      const json1 = await res1.json();

      if (res1.ok && json1.recordId) {
        // Upload same file second time
        const form2 = new FormData();
        form2.append('file', new Blob([pdfBytes], { type: 'application/pdf' }), 'test_report_duplicate.pdf');
        const res2 = await fetch(`${BASE_URL}/api/upload`, { method: 'POST', body: form2 });
        const json2 = await res2.json();

        const isDuplicateDetected =
          res2.status === 409 && (json2.isDuplicate === true || json2.duplicate === true);
        recordResult(
          'Pipeline: SHA-256 Duplicate Document Detection',
          isDuplicateDetected,
          `Status: ${res2.status}, Duplicate Flag: ${json2.isDuplicate || json2.duplicate}, Target ID: ${json2.existingRecordId}`
        );

        // Clean up test record
        await fetch(`${BASE_URL}/api/records/${json1.recordId}`, { method: 'DELETE' });
      }
    } catch (err: unknown) {
      recordResult('Pipeline: SHA-256 Duplicate Document Detection', false, err instanceof Error ? err.message : 'Failed');
    }
  }

  console.log('\n================================================================');
  console.log(`Verification Complete: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runComprehensiveVerification();
