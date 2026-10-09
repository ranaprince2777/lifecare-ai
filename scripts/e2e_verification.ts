import fs from 'fs';
import path from 'path';

async function runEndToEndVerification() {
  console.log('====================================================');
  console.log('LifeCare AI — Complete End-to-End Readiness Audit');
  console.log('====================================================\n');

  const BASE_URL = 'http://localhost:3000';
  let passedCount = 0;
  let totalCount = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalCount++;
    if (condition) {
      passedCount++;
      console.log(`✅ [PASS] ${testName}`);
      if (detail) console.log(`   └─ ${detail}`);
    } else {
      console.log(`❌ [FAIL] ${testName}`);
      if (detail) console.log(`   └─ ${detail}`);
    }
  }

  // 1. Dev Server Health
  try {
    const healthRes = await fetch(`${BASE_URL}/api/records`);
    assert(healthRes.ok, 'Dev Server & Records API Connectivity', `Status: ${healthRes.status}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Connection failed';
    assert(false, 'Dev Server & Records API Connectivity', `Failed to connect: ${msg}`);
  }

  // 2. Test Invalid Files: Empty Buffer
  try {
    const emptyBlob = new Blob([], { type: 'application/pdf' });
    const emptyForm = new FormData();
    emptyForm.append('file', emptyBlob, 'empty.pdf');

    const emptyRes = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: emptyForm,
    });
    const emptyJson = await emptyRes.json();
    assert(
      emptyRes.status === 400 && emptyJson.error && emptyJson.error.includes('empty'),
      'Reject Empty File (0 Bytes)',
      `Returned HTTP ${emptyRes.status}: "${emptyJson.error}"`
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error';
    assert(false, 'Reject Empty File', msg);
  }

  // 3. Test Invalid Files: Oversized (> 10 MB)
  try {
    // 10.5 MB buffer
    const largeBuf = new Uint8Array(10.5 * 1024 * 1024);
    const largeBlob = new Blob([largeBuf], { type: 'application/pdf' });
    const largeForm = new FormData();
    largeForm.append('file', largeBlob, 'oversized.pdf');

    const largeRes = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: largeForm,
    });
    const largeJson = await largeRes.json();
    assert(
      largeRes.status === 400 && largeJson.error && largeJson.error.includes('exceeds maximum allowed limit'),
      'Reject Oversized File (> 10 MB)',
      `Returned HTTP ${largeRes.status}: "${largeJson.error}"`
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error';
    assert(false, 'Reject Oversized File', msg);
  }

  // 4. Test Invalid Files: Unsupported MIME Type
  try {
    const binBlob = new Blob(['sample binary executable data'], { type: 'application/octet-stream' });
    const binForm = new FormData();
    binForm.append('file', binBlob, 'malware.bin');

    const binRes = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: binForm,
    });
    const binJson = await binRes.json();
    assert(
      binRes.status === 400 && binJson.error && binJson.error.includes('Unsupported file format'),
      'Reject Unsupported File Format',
      `Returned HTTP ${binRes.status}: "${binJson.error}"`
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error';
    assert(false, 'Reject Unsupported File Format', msg);
  }

  // 5. Test Real PDF Upload & Processing Flow
  let uploadedRecordId = '';
  try {
    const pdfPath = path.join(process.cwd(), 'public', 'sample_lab_report.pdf');
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`File not found: ${pdfPath}`);
    }
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
    const pdfForm = new FormData();
    pdfForm.append('file', pdfBlob, 'Anita_Desai_Lab_Report.pdf');

    const uploadRes = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: pdfForm,
    });
    const uploadData = await uploadRes.json();

    assert(
      uploadRes.ok && uploadData.success && uploadData.recordId,
      'Valid Clinical PDF Upload & Pipeline Ingestion',
      `Record ID: ${uploadData.recordId}, Extracted Text Length: ${uploadData.record?.rawExtractedText?.length || 0} chars`
    );

    uploadedRecordId = uploadData.recordId;

    // Verify AI mode reporting
    if (uploadData.aiExtractionSuccess) {
      console.log('   ℹ️ Mode: Live Gemini AI Extraction executed successfully.');
    } else {
      console.log(`   ℹ️ Mode: Safe fallback mode active (${uploadData.warning || 'No API key in .env.local'}).`);
    }

    // Verify raw text was truly extracted from the PDF
    const rawText = uploadData.record?.rawExtractedText || '';
    assert(
      rawText.includes('Fasting Plasma Glucose') && rawText.includes('Serum Uric Acid'),
      'Text Extraction Real Clinical Content Verification',
      'Extracted real test names ("Fasting Plasma Glucose", "Serum Uric Acid") from embedded PDF bytes'
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Upload failed';
    assert(false, 'Valid Clinical PDF Upload', msg);
  }

  // 6. Test Duplicate Detection Prevention
  if (uploadedRecordId) {
    try {
      const pdfPath = path.join(process.cwd(), 'public', 'sample_lab_report.pdf');
      const pdfBuffer = fs.readFileSync(pdfPath);
      const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const dupForm = new FormData();
      dupForm.append('file', pdfBlob, 'Anita_Desai_Lab_Report_Copy.pdf');

      const dupRes = await fetch(`${BASE_URL}/api/upload`, {
        method: 'POST',
        body: dupForm,
      });
      const dupData = await dupRes.json();

      assert(
        dupRes.status === 409 && dupData.isDuplicate === true && dupData.existingRecordId === uploadedRecordId,
        'SHA-256 Cryptographic Duplicate Upload Detection',
        `Returned HTTP 409 Conflict, identified existing document ID: ${dupData.existingRecordId}`
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error';
      assert(false, 'Duplicate Upload Detection', msg);
    }
  }

  // 7. Test Record Retrieval via GET /api/records/[id]
  if (uploadedRecordId) {
    try {
      const getRes = await fetch(`${BASE_URL}/api/records/${uploadedRecordId}`);
      const getData = await getRes.json();
      assert(
        getRes.ok && getData.record && getData.record.id === uploadedRecordId,
        'Record Retrieval by ID (/api/records/[id])',
        `Retrieved file: "${getData.record?.fileName}", method: ${getData.record?.extractionMethod}`
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error';
      assert(false, 'Record Retrieval by ID', msg);
    }
  }

  // 8. Test Timeline and Archive Listings
  if (uploadedRecordId) {
    try {
      const listRes = await fetch(`${BASE_URL}/api/records`);
      const listData = await listRes.json();
      const foundInList = listData.records.some((r: { id: string }) => r.id === uploadedRecordId);
      assert(
        listRes.ok && foundInList,
        'Record Persistence in Archive & Timeline (/api/records)',
        `Total records in store: ${listData.records.length}`
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error';
      assert(false, 'Record Persistence in Archive & Timeline', msg);
    }
  }

  // 9. Test HL7 FHIR R4 Bundle Export
  if (uploadedRecordId) {
    try {
      const fhirRes = await fetch(`${BASE_URL}/api/records/${uploadedRecordId}/fhir`);
      const fhirBundle = await fhirRes.json();
      assert(
        fhirRes.ok && fhirBundle.resourceType === 'Bundle' && fhirBundle.type === 'collection',
        'HL7 FHIR R4 Bundle Generation & Interoperability',
        `Resource entries: ${fhirBundle.entry?.length || 0}, mapped standard: ${fhirBundle.mappingNotes?.standard}`
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error';
      assert(false, 'HL7 FHIR R4 Bundle Generation', msg);
    }
  }

  // 10. Clean up test record to maintain clean state
  if (uploadedRecordId) {
    try {
      await fetch(`${BASE_URL}/api/records/${uploadedRecordId}`, { method: 'DELETE' });
      console.log(`\n🧹 Cleaned up temporary test record (${uploadedRecordId})`);
    } catch {
      // ignore
    }
  }

  console.log('\n====================================================');
  console.log(`Audit Summary: ${passedCount}/${totalCount} End-to-End Checks Passed`);
  console.log('====================================================\n');
}

runEndToEndVerification();
