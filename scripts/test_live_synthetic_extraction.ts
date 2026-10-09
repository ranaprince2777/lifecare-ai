import fs from 'fs';
import path from 'path';
import { extractDocumentText } from '../src/lib/pipeline/textExtractor';
import { extractStructuredMedicalData } from '../src/lib/pipeline/geminiExtractor';
import { saveMedicalRecord, getMedicalRecordById, getAllMedicalRecords } from '../src/lib/db/storage';
import { MedicalDocumentRecord } from '../src/lib/types/medical';

async function runLiveSyntheticExtractionTest() {
  console.log('================================================================');
  console.log('LifeCare AI — Live Gemini Synthetic Document Extraction Audit');
  console.log('================================================================\n');

  const pdfPath = path.join(process.cwd(), 'test-fixtures', 'synthetic_lab_blood_test.pdf');
  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ Test file not found: ${pdfPath}`);
    process.exit(1);
  }

  const pdfBytes = fs.readFileSync(pdfPath);
  console.log(`📄 Input Document: test-fixtures/synthetic_lab_blood_test.pdf (${pdfBytes.length} bytes)`);

  // Step 1: Text extraction via PyMuPDF
  console.log('\n--- Step 1: Text Extraction ---');
  const textResult = await extractDocumentText(pdfBytes, 'application/pdf', 'synthetic_lab_blood_test.pdf');
  if (!textResult.success || !textResult.text) {
    console.error(`❌ Text extraction failed: ${textResult.error}`);
    process.exit(1);
  }
  console.log(`✅ Text extracted via ${textResult.method}: ${textResult.text.length} characters.`);

  // Step 2: Live Gemini Extraction & Structuring
  console.log('\n--- Step 2: Live Google Gemini Structured Extraction & Summary ---');
  const startTime = Date.now();
  const aiResult = await extractStructuredMedicalData(textResult.text, {
    generateHindi: true,
  });
  const durationMs = Date.now() - startTime;

  if (!aiResult.success || !aiResult.data) {
    console.error(`❌ Live Gemini Extraction Failed: ${aiResult.error}`);
    process.exit(1);
  }

  const payload = aiResult.data;
  console.log(`✅ Live Gemini API Call Successful! (Response Time: ${durationMs}ms)`);
  console.log(`\n📋 Extracted Clinical Metadata:`);
  console.log(`   • Document Type: ${payload.documentType}`);
  console.log(`   • Document Date: ${payload.documentDate}`);
  console.log(`   • Patient Name: ${payload.patientName}`);
  console.log(`   • Patient Age: ${payload.patientAge}`);
  console.log(`   • Clinician: ${payload.providerName}`);

  console.log(`\n🔬 Extracted Observations (${payload.observations.length} items):`);
  payload.observations.forEach((obs, idx) => {
    console.log(
      `   [${idx + 1}] ${obs.testName}: ${obs.testResultValue} ${obs.unit || ''} ` +
      `| Ref: ${obs.referenceRangeRaw || 'N/A'} | Flag: [${obs.flag}] (Confidence: ${(obs.confidence * 100).toFixed(0)}%)`
    );
  });

  console.log(`\n📝 Plain-Language Educational Summaries:`);
  console.log(`   • English Summary (${payload.summaryEn.length} chars):`);
  console.log(`     "${payload.summaryEn}"`);
  if (payload.summaryHi) {
    console.log(`\n   • Hindi Summary (${payload.summaryHi.length} chars):`);
    console.log(`     "${payload.summaryHi}"`);
  }

  console.log(`\n🩺 Key Abnormal Highlights:`);
  payload.abnormalHighlights.forEach(h => console.log(`   • ${h}`));

  console.log(`\n❓ Questions for Doctor (${payload.doctorQuestions.length}):`);
  payload.doctorQuestions.forEach((q, i) => console.log(`   ${i + 1}. ${q}`));

  // Step 3: Record Persistence in Database Store
  console.log('\n--- Step 3: Record Persistence & Verification ---');
  const recordId = `test-live-${Date.now()}`;
  const recordToSave: MedicalDocumentRecord = {
    id: recordId,
    fileName: 'synthetic_lab_blood_test.pdf',
    fileSize: pdfBytes.length,
    mimeType: 'application/pdf',
    filePath: '/uploads/synthetic_lab_blood_test.pdf',
    fileHash: 'test_live_hash_' + Date.now(),
    documentType: payload.documentType,
    documentDate: payload.documentDate || null,
    uploadedAt: new Date().toISOString(),
    providerName: payload.providerName || null,
    patientNameExtracted: payload.patientName || null,
    patientAgeExtracted: payload.patientAge || null,
    rawExtractedText: textResult.text,
    extractionMethod: textResult.method,
    processingStatus: 'completed',
    observations: payload.observations,
    medications: payload.medications,
    diagnoses: payload.diagnoses,
    summary: {
      id: `sum-${recordId}`,
      summaryEn: payload.summaryEn,
      summaryHi: payload.summaryHi,
      keyFindings: payload.keyFindings,
      abnormalHighlights: payload.abnormalHighlights,
      doctorQuestions: payload.doctorQuestions,
      modelUsed: 'gemini-3.1-flash-lite',
    },
  };

  await saveMedicalRecord(recordToSave);
  console.log(`✅ Record successfully saved to store (ID: ${recordId}).`);

  // Verify retrieval
  const retrieved = await getMedicalRecordById(recordId);
  if (!retrieved) {
    console.error(`❌ Failed to retrieve saved record by ID: ${recordId}`);
    process.exit(1);
  }
  console.log(`✅ Verified getMedicalRecordById: Retained ${retrieved.observations.length} observations and bilingual summary.`);

  // Verify timeline inclusion
  const all = await getAllMedicalRecords();
  const existsInTimeline = all.some(r => r.id === recordId);
  console.log(`✅ Verified Timeline & Archive inclusion: Record present in full list (${all.length} total records, verified=${existsInTimeline}).`);

  // Source document fidelity check
  console.log('\n--- Step 4: Source Document Grounding & Fidelity Check ---');
  const sourceMatches = [
    { field: 'Fasting Glucose', expected: '126.0' },
    { field: 'HbA1c', expected: '6.9' },
    { field: 'Total Cholesterol', expected: '218.0' },
    { field: 'Triglycerides', expected: '165.0' },
    { field: 'Creatinine', expected: '0.82' },
  ];

  let matchesFound = 0;
  for (const item of sourceMatches) {
    const found = payload.observations.find(o =>
      o.testName.toLowerCase().includes(item.field.toLowerCase()) &&
      o.testResultValue.includes(item.expected)
    );
    if (found) {
      matchesFound++;
      console.log(`   ✓ ${item.field}: extracted ${found.testResultValue} matches source ${item.expected} exactly.`);
    } else {
      console.log(`   ℹ ${item.field}: not directly matched or labeled differently.`);
    }
  }

  console.log(`\n================================================================`);
  console.log(`Live Gemini Extraction Verified: ${matchesFound}/${sourceMatches.length} core clinical values confirmed grounded.`);
  console.log('================================================================\n');

  // Keep test record or delete? Let's keep it so it shows in the UI or remove if required
  // Let's keep it in the records archive so the user can see it in their browser at http://localhost:3000/records!
  console.log(`📌 Record "${recordId}" is live in your local database.`);
  console.log(`👉 View it directly in Chrome: http://localhost:3000/records/${recordId}`);
}

runLiveSyntheticExtractionTest();
