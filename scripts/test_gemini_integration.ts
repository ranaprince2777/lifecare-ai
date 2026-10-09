import fs from 'fs';
import path from 'path';
import { extractStructuredMedicalData } from '../src/lib/pipeline/geminiExtractor';

/**
 * Loads .env.local variables manually if not already in process.env
 */
function loadEnvLocal() {
  const envLocalPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const content = fs.readFileSync(envLocalPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim();
        const value = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key] && value) {
          process.env[key] = value;
        }
      }
    }
  }
}

async function runGeminiIntegrationTest() {
  console.log('====================================================');
  console.log('LifeCare AI — Google Gemini API Integration Test');
  console.log('====================================================\n');

  loadEnvLocal();

  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!key || key.trim() === '' || key === 'your_gemini_api_key_here') {
    console.log('❌ GEMINI_API_KEY is not set or empty in .env.local.');
    console.log('\nTo configure your API key:');
    console.log('1. Open .env.local in the project root.');
    console.log('2. Add: GEMINI_API_KEY=your_actual_key_here');
    console.log('3. Re-run: npx tsx scripts/test_gemini_integration.ts\n');
    process.exit(1);
  }

  // Sanitize key confirmation (never reveal characters)
  const maskedLength = key.trim().length;
  console.log(`✓ GEMINI_API_KEY detected in .env.local (${maskedLength} characters, unexposed).`);
  console.log('Connecting to Google Gemini API for structured extraction...\n');

  const sampleReportText = `
METRO HEALTH DIAGNOSTICS & PATHOLOGY
Patient: Sunita Sharma | Age/Gender: 42/F | Date: 02-Apr-2026
Ref by: Dr. Vikram Joshi, MD

TEST NAME                   RESULT      UNIT        REFERENCE RANGE   FLAG
--------------------------------------------------------------------------
Fasting Blood Sugar         138.0       mg/dL       70.0 - 99.0       HIGH
Serum Creatinine            0.85        mg/dL       0.60 - 1.20       NORMAL
--------------------------------------------------------------------------
End of Report.
`;

  try {
    const startTime = Date.now();
    const result = await extractStructuredMedicalData(sampleReportText, {
      generateHindi: true,
    });
    const elapsed = Date.now() - startTime;

    if (!result.success || !result.data) {
      console.log('❌ Gemini Extraction Failed:');
      console.log(`   ${result.error}\n`);
      process.exit(1);
    }

    const data = result.data;

    console.log(`✅ Integration Successful! (${elapsed}ms response time)\n`);
    console.log('--- Structured Extraction Validation ---');
    console.log(`• Document Type: ${data.documentType}`);
    console.log(`• Document Date: ${data.documentDate || 'Not specified'}`);
    console.log(`• Provider Name: ${data.providerName || 'Not specified'}`);
    console.log(`• Extracted Observations Count: ${data.observations.length}`);

    data.observations.forEach((obs, i) => {
      console.log(
        `  [${i + 1}] ${obs.testName}: ${obs.testResultValue} ${obs.unit || ''} ` +
        `(Ref: ${obs.referenceRangeRaw || 'N/A'}) => Flag: [${obs.flag}]`
      );
    });

    console.log('\n--- Plain-Language Educational Summary ---');
    console.log(`• English: "${data.summaryEn.substring(0, 160)}..."`);
    if (data.summaryHi) {
      console.log(`• Hindi: "${data.summaryHi.substring(0, 120)}..."`);
    }
    console.log(`• Questions for Doctor (${data.doctorQuestions.length}):`);
    data.doctorQuestions.slice(0, 2).forEach((q, i) => {
      console.log(`  ${i + 1}. ${q}`);
    });

    console.log('\n====================================================');
    console.log('All schemas validated with Zod. Pipeline is live.');
    console.log('====================================================\n');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown test failure';
    console.log(`❌ Unexpected Test Error: ${msg}`);
    process.exit(1);
  }
}

runGeminiIntegrationTest();
