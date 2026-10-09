import fs from 'fs';
import path from 'path';

async function testSyntheticPipeline() {
  console.log('================================================================');
  console.log('LifeCare AI — Synthetic Document Processing & OCR Audit');
  console.log('================================================================\n');

  const BASE_URL = 'http://localhost:3000';
  const createdRecordIds: string[] = [];

  // Helper function to upload a file
  async function uploadDocument(fileName: string, mimeType: string, generateHindi = true) {
    const filePath = path.join(process.cwd(), 'test-fixtures', fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Test file not found: ${filePath}`);
    }
    const fileBytes = fs.readFileSync(filePath);
    const form = new FormData();
    form.append('file', new Blob([fileBytes], { type: mimeType }), fileName);
    form.append('generateHindi', generateHindi ? 'true' : 'false');

    const res = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: form,
    });
    const json = await res.json();
    return { status: res.status, ok: res.ok, json };
  }

  // --- TEST 1: Digital PDF (Blood & Metabolic Panel) ---
  console.log('--- 1. Testing Digital PDF Extraction (synthetic_lab_blood_test.pdf) ---');
  try {
    const res = await uploadDocument('synthetic_lab_blood_test.pdf', 'application/pdf');
    if (res.ok && res.json.record) {
      const rec = res.json.record;
      createdRecordIds.push(rec.id);
      console.log(`✅ [PASS] Upload & Digital Text Extraction Successful`);
      console.log(`   └─ Record ID: ${rec.id}`);
      console.log(`   └─ File Name: ${rec.fileName}`);
      console.log(`   └─ Extraction Method: ${rec.extractionMethod}`);
      console.log(`   └─ Document Type: ${rec.documentType}`);
      console.log(`   └─ Raw Extracted Text Length: ${rec.rawExtractedText?.length || 0} characters`);
      console.log(`   └─ Extracted Observations Count: ${rec.observations?.length || 0}`);
      console.log(`   └─ English Summary Length: ${rec.summary?.summaryEn?.length || 0} characters`);
      console.log(`   └─ Bilingual (Hindi) Summary: ${!!rec.summary?.summaryHi ? 'Present' : 'Not generated'}`);
    } else {
      console.log(`❌ [FAIL] Digital PDF Upload: Status ${res.status}, Error: ${res.json.error}`);
    }
  } catch (err: unknown) {
    console.log(`❌ [FAIL] Digital PDF Extraction failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // --- TEST 2: Image PNG Prescription OCR (synthetic_prescription.png) ---
  console.log('\n--- 2. Testing Image OCR Pipeline (synthetic_prescription.png) ---');
  try {
    const res = await uploadDocument('synthetic_prescription.png', 'image/png');
    if (res.ok && res.json.record) {
      const rec = res.json.record;
      createdRecordIds.push(rec.id);
      console.log(`✅ [PASS] PNG Upload & Tesseract.js OCR Successful`);
      console.log(`   └─ Record ID: ${rec.id}`);
      console.log(`   └─ Extraction Method: ${rec.extractionMethod}`);
      console.log(`   └─ Raw OCR Text Length: ${rec.rawExtractedText?.length || 0} characters`);
      console.log(`   └─ Medications Extracted: ${rec.medications?.length || 0}`);
      console.log(`   └─ Diagnoses Extracted: ${rec.diagnoses?.length || 0}`);
    } else {
      console.log(`❌ [FAIL] Image OCR Upload: Status ${res.status}, Error: ${res.json.error}`);
    }
  } catch (err: unknown) {
    console.log(`❌ [FAIL] Image OCR Extraction failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // --- TEST 2b: Scanned-style PDF with OCR Fallback (synthetic_scanned_cbc_report.pdf) ---
  console.log('\n--- 2b. Testing Scanned PDF Automated OCR (synthetic_scanned_cbc_report.pdf) ---');
  try {
    const res = await uploadDocument('synthetic_scanned_cbc_report.pdf', 'application/pdf');
    if (res.ok && res.json.record) {
      const rec = res.json.record;
      createdRecordIds.push(rec.id);
      console.log(`✅ [PASS] Scanned PDF Image Rasterization & OCR Successful`);
      console.log(`   └─ Record ID: ${rec.id}`);
      console.log(`   └─ Extraction Method: ${rec.extractionMethod}`);
      console.log(`   └─ Raw OCR Text Length: ${rec.rawExtractedText?.length || 0} characters`);
    } else {
      console.log(`❌ [FAIL] Scanned PDF OCR Upload: Status ${res.status}, Error: ${res.json.error}`);
    }
  } catch (err: unknown) {
    console.log(`❌ [FAIL] Scanned PDF OCR failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // --- TEST 3: Verify Persistence & Timeline Inclusion ---
  console.log('\n--- 3. Testing Record Persistence & Timeline Integration ---');
  try {
    const res = await fetch(`${BASE_URL}/api/records`);
    const json = await res.json();
    const allRecords = json.records || [];
    const persistedMatches = createdRecordIds.filter(id => allRecords.some((r: { id: string }) => r.id === id));
    if (persistedMatches.length === createdRecordIds.length) {
      console.log(`✅ [PASS] All ${createdRecordIds.length} synthetic records successfully persisted in local store`);
      console.log(`   └─ Total Records currently available in Archive/Timeline: ${allRecords.length}`);
    } else {
      console.log(`❌ [FAIL] Only ${persistedMatches.length}/${createdRecordIds.length} synthetic records found in store`);
    }
  } catch (err: unknown) {
    console.log(`❌ [FAIL] Persistence check failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // --- CLEANUP ---
  console.log('\n--- 4. Cleaning up Synthetic Test Records ---');
  for (const id of createdRecordIds) {
    try {
      await fetch(`${BASE_URL}/api/records/${id}`, { method: 'DELETE' });
      console.log(`🧹 Cleaned up test record: ${id}`);
    } catch {
      // ignore
    }
  }

  console.log('\n================================================================');
  console.log('Synthetic Pipeline Audit Complete.');
  console.log('================================================================\n');
}

testSyntheticPipeline();
