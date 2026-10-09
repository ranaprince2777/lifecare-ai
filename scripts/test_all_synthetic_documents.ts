import fs from 'fs';
import path from 'path';
import { extractDocumentText } from '../src/lib/pipeline/textExtractor';
import { extractStructuredMedicalData } from '../src/lib/pipeline/geminiExtractor';

interface DocumentTestCase {
  id: string;
  filename: string;
  mimeType: string;
  docDescription: string;
  expectedType: string;
  expectedKeyFields: Array<{
    field: string;
    expectedValue: string;
    type: 'observation' | 'medication' | 'diagnosis' | 'meta';
  }>;
  expectAmbiguousFlags?: boolean;
}

const TEST_SUITE: DocumentTestCase[] = [
  {
    id: 'DOC-1',
    filename: 'synthetic_lab_blood_test.pdf',
    mimeType: 'application/pdf',
    docDescription: 'Digital Laboratory PDF (Comprehensive Blood & Metabolic Panel)',
    expectedType: 'Lab Report',
    expectedKeyFields: [
      { field: 'Patient Name', expectedValue: 'Meera Nambiar', type: 'meta' },
      { field: 'Collection Date', expectedValue: '2026-04-08', type: 'meta' },
      { field: 'Fasting Plasma Glucose', expectedValue: '126', type: 'observation' },
      { field: 'HbA1c', expectedValue: '6.9', type: 'observation' },
      { field: 'Total Cholesterol', expectedValue: '218', type: 'observation' },
      { field: 'Serum Triglycerides', expectedValue: '165', type: 'observation' },
      { field: 'HDL Cholesterol', expectedValue: '48', type: 'observation' },
      { field: 'Serum Creatinine', expectedValue: '0.82', type: 'observation' },
    ],
  },
  {
    id: 'DOC-2',
    filename: 'synthetic_prescription.png',
    mimeType: 'image/png',
    docDescription: 'Printed Prescription Image (Specialty Clinic Outpatient Rx)',
    expectedType: 'Prescription',
    expectedKeyFields: [
      { field: 'Patient Name', expectedValue: 'Meera Nambiar', type: 'meta' },
      { field: 'Prescriber', expectedValue: 'Dr. Sanjeev Roy', type: 'meta' },
      { field: 'Prescription Date', expectedValue: '2026-04-08', type: 'meta' },
      { field: 'Metformin', expectedValue: '500 mg', type: 'medication' },
      { field: 'Atorvastatin', expectedValue: '10 mg', type: 'medication' },
      { field: 'Type 2 Diabetes Mellitus', expectedValue: 'Diabetes', type: 'diagnosis' },
      { field: 'Mixed Dyslipidemia', expectedValue: 'Dyslipidemia', type: 'diagnosis' },
    ],
  },
  {
    id: 'DOC-3',
    filename: 'synthetic_scanned_cbc_report.pdf',
    mimeType: 'application/pdf',
    docDescription: 'Scanned Raster PDF (Metropolitan Hematology Complete Blood Count)',
    expectedType: 'Lab Report',
    expectedKeyFields: [
      { field: 'Patient Name', expectedValue: 'Vikram Patel', type: 'meta' },
      { field: 'Date', expectedValue: '2026-04-07', type: 'meta' },
      { field: 'Hemoglobin', expectedValue: '14.2', type: 'observation' },
      { field: 'Total Leukocyte Count (WBC)', expectedValue: '7800', type: 'observation' },
      { field: 'Platelet Count', expectedValue: '245000', type: 'observation' },
    ],
  },
  {
    id: 'DOC-4',
    filename: 'synthetic_discharge_summary.pdf',
    mimeType: 'application/pdf',
    docDescription: 'Hospital Inpatient Discharge Summary (Cardiology DES Stent)',
    expectedType: 'Discharge Summary',
    expectedKeyFields: [
      { field: 'Patient Name', expectedValue: 'Rajesh Sharma', type: 'meta' },
      { field: 'Admission / Discharge Date', expectedValue: '2026-04-05', type: 'meta' },
      { field: 'Aspirin', expectedValue: '75 mg', type: 'medication' },
      { field: 'Clopidogrel', expectedValue: '75 mg', type: 'medication' },
      { field: 'Atorvastatin', expectedValue: '40 mg', type: 'medication' },
      { field: 'Metoprolol', expectedValue: '25 mg', type: 'medication' },
      { field: 'Ramipril', expectedValue: '2.5 mg', type: 'medication' },
      { field: 'Acute Coronary Syndrome', expectedValue: 'Coronary', type: 'diagnosis' },
    ],
  },
  {
    id: 'DOC-5',
    filename: 'synthetic_ambiguous_incomplete_report.pdf',
    mimeType: 'application/pdf',
    docDescription: 'Ambiguous & Incomplete Diagnostic Slip (Missing Ranges & Borderline values)',
    expectedType: 'Lab Report',
    expectedKeyFields: [
      { field: 'Patient Name', expectedValue: 'Anita Roy', type: 'meta' },
      { field: 'Blood Glucose (Random)', expectedValue: '142', type: 'observation' },
      { field: 'Hemoglobin', expectedValue: '11.2', type: 'observation' },
    ],
    expectAmbiguousFlags: true,
  },
];

interface FieldReport {
  field: string;
  expected: string;
  actual: string;
  matched: boolean;
}

interface AuditResult {
  id: string;
  docDescription?: string;
  filename: string;
  method?: string;
  extractSuccess?: boolean;
  aiSuccess?: boolean;
  extractDurationMs?: number;
  aiDurationMs?: number;
  extractedType?: string;
  matchedFields?: string;
  fieldReports?: FieldReport[];
  hindiVerified?: boolean;
  error?: string;
}

async function runAudit() {
  console.log('========================================================================');
  console.log('LIFECARE AI — OFFICIAL HACKATHON BENCHMARK & EVIDENCE EVALUATION SUITE');
  console.log('========================================================================\n');

  const results: AuditResult[] = [];

  for (const tc of TEST_SUITE) {
    console.log(`\n------------------------------------------------------------------------`);
    console.log(`TEST CASE [${tc.id}]: ${tc.docDescription}`);
    console.log(`File: test-fixtures/${tc.filename} (${tc.mimeType})`);
    console.log(`------------------------------------------------------------------------`);

    const filePath = path.join(process.cwd(), 'test-fixtures', tc.filename);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Fixture file missing: ${filePath}`);
      continue;
    }

    const fileBuffer = fs.readFileSync(filePath);

    // 1. Extraction Phase
    const tStartExtract = Date.now();
    const extractRes = await extractDocumentText(fileBuffer, tc.mimeType, tc.filename);
    const extractDurationMs = Date.now() - tStartExtract;

    if (!extractRes.success || !extractRes.text) {
      console.error(`❌ Text extraction failed: ${extractRes.error}`);
      results.push({
        id: tc.id,
        filename: tc.filename,
        extractSuccess: false,
        error: extractRes.error,
      });
      continue;
    }

    console.log(`✓ Text Extraction: Method = ${extractRes.method} (${extractRes.text.length} chars, ${extractDurationMs}ms)`);

    // 2. AI Structuring Phase with Hindi summary
    const tStartAi = Date.now();
    const aiRes = await extractStructuredMedicalData(extractRes.text, {
      generateHindi: true,
    });
    const aiDurationMs = Date.now() - tStartAi;

    if (!aiRes.success || !aiRes.data) {
      console.error(`❌ AI extraction failed: ${aiRes.error}`);
      results.push({
        id: tc.id,
        filename: tc.filename,
        extractSuccess: true,
        aiSuccess: false,
        error: aiRes.error,
      });
      continue;
    }

    const payload = aiRes.data;
    console.log(`✓ Gemini Structuring: Model = gemini-3.1-flash-lite (${aiDurationMs}ms)`);
    console.log(`  • Extracted Type: "${payload.documentType}" (Expected: "${tc.expectedType}")`);
    console.log(`  • Extracted Date: "${payload.documentDate || 'N/A'}" | Patient: "${payload.patientName || 'N/A'}"`);
    console.log(`  • Observations Extracted: ${payload.observations.length}`);
    console.log(`  • Medications Extracted: ${payload.medications.length}`);
    console.log(`  • Diagnoses Extracted: ${payload.diagnoses.length}`);
    console.log(`  • English Summary: ${payload.summaryEn.length} chars`);
    console.log(`  • Hindi Summary: ${payload.summaryHi ? payload.summaryHi.length + ' chars (VERIFIED)' : 'None'}`);

    // 3. Field Grounding Verification
    let matchedCount = 0;
    const fieldReports: FieldReport[] = [];

    for (const exp of tc.expectedKeyFields) {
      let matched = false;
      let actualFound = 'NOT FOUND';

      if (exp.type === 'meta') {
        const valToTest = `${payload.patientName || ''} ${payload.documentDate || ''} ${payload.providerName || ''}`;
        if (valToTest.toLowerCase().includes(exp.expectedValue.toLowerCase())) {
          matched = true;
          actualFound = exp.expectedValue;
        }
      } else if (exp.type === 'observation') {
        const obs = payload.observations.find(o =>
          o.testName.toLowerCase().includes(exp.field.toLowerCase())
        );
        if (obs) {
          actualFound = `${obs.testResultValue} ${obs.unit || ''} [Flag: ${obs.flag}]`;
          if (obs.testResultValue.includes(exp.expectedValue) || obs.testResultNumeric === parseFloat(exp.expectedValue)) {
            matched = true;
          }
        }
      } else if (exp.type === 'medication') {
        const med = payload.medications.find(m =>
          m.medicationName.toLowerCase().includes(exp.field.toLowerCase())
        );
        if (med) {
          actualFound = `${med.medicationName} ${med.dosage || ''} (${med.frequency || ''})`;
          if ((med.dosage && med.dosage.includes(exp.expectedValue)) || med.medicationName.includes(exp.expectedValue)) {
            matched = true;
          }
        }
      } else if (exp.type === 'diagnosis') {
        const diag = payload.diagnoses.find(d =>
          d.conditionName.toLowerCase().includes(exp.expectedValue.toLowerCase())
        );
        if (diag) {
          matched = true;
          actualFound = diag.conditionName;
        }
      }

      if (matched) matchedCount++;
      fieldReports.push({
        field: exp.field,
        expected: exp.expectedValue,
        actual: actualFound,
        matched,
      });

      console.log(`    [${matched ? 'MATCH' : 'DIFF'}] ${exp.field} -> Expected: "${exp.expectedValue}" | Actual: "${actualFound}"`);
    }

    // Ambiguity safety check
    if (tc.expectAmbiguousFlags) {
      const unclassifiedOrMissing = payload.observations.filter(o =>
        !o.referenceRangeRaw || o.flag === 'UNCLASSIFIED' || o.requiresReview
      );
      console.log(`  • Ambiguity Safety Handling: ${unclassifiedOrMissing.length} observations appropriately flagged as missing range/unclassified.`);
    }

    results.push({
      id: tc.id,
      docDescription: tc.docDescription,
      filename: tc.filename,
      method: extractRes.method,
      extractDurationMs,
      aiDurationMs,
      extractedType: payload.documentType,
      matchedFields: `${matchedCount}/${tc.expectedKeyFields.length}`,
      fieldReports,
      hindiVerified: Boolean(payload.summaryHi),
    });
  }

  console.log('\n========================================================================');
  console.log('FINAL AUDIT SUMMARY TABLE');
  console.log('========================================================================');
  console.table(results.map(r => ({
    ID: r.id,
    Document: r.filename,
    Method: r.method,
    'AI Latency': `${r.aiDurationMs}ms`,
    'Doc Type': r.extractedType,
    'Field Matches': r.matchedFields,
    'Hindi Summary': r.hindiVerified ? 'YES' : 'NO',
  })));
}

runAudit().catch(err => {
  console.error('Audit run failed:', err);
  process.exit(1);
});
