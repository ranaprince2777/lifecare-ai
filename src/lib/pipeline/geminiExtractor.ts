import {
  MedicalExtractionPayload,
  MedicalExtractionPayloadSchema,
  ExtractedObservation,
} from '../types/medical';
import { evaluateObservationAgainstRange } from './referenceRangeValidator';
import {
  getGeminiClient,
  formatGeminiError,
  FALLBACK_GEMINI_MODELS,
} from '../ai/geminiClient';

export interface ExtractionOptions {
  apiKey?: string;
  generateHindi?: boolean;
}

const MEDICAL_SYSTEM_PROMPT = `
You are a specialized clinical data extraction assistant. Your job is to extract structured clinical information and generate a plain-language educational summary from the provided document text.

CRITICAL RULES:
1. STRICT TRUTHFULNESS: Never invent or assume missing values, units, dates, medicines, dosages, or diagnoses. If a value is missing or unclear, output null.
2. DO NOT DIAGNOSE: Do not produce new clinical diagnoses. Only extract conditions explicitly written in the source document.
3. GROUNDING: For observations and medications, preserve exact source text where available.
4. CAUTIOUS SUMMARY: The summary must be plain-language, empathetic, and strictly educational. State clearly that values outside a reference range do not by themselves establish a diagnosis and encourage consulting a qualified doctor.
5. HINDI TRANSLATION: If requested, provide an accurate, respectful Hindi translation of the summary in Devanagari script, keeping clinical drug names and units in their familiar form.

You must respond ONLY with valid JSON conforming to the following structure:
{
  "documentType": "Lab Report" | "Prescription" | "Diagnostic Report" | "Discharge Summary" | "Other",
  "documentDate": "YYYY-MM-DD" or null,
  "providerName": string or null,
  "patientName": string or null,
  "patientAge": number or null,
  "observations": [
    {
      "testName": string,
      "category": string,
      "testResultValue": string,
      "testResultNumeric": number or null,
      "unit": string or null,
      "referenceRangeRaw": string or null,
      "flag": "NORMAL" | "HIGH" | "LOW" | "CRITICAL_HIGH" | "CRITICAL_LOW" | "UNCLASSIFIED",
      "flagSource": "source_reported" | "unspecified",
      "confidence": number (0.0 to 1.0),
      "requiresReview": boolean,
      "sourceText": string or null
    }
  ],
  "medications": [
    {
      "medicationName": string,
      "dosage": string or null,
      "frequency": string or null,
      "duration": string or null,
      "route": string or null,
      "instructions": string or null,
      "isActive": boolean,
      "confidence": number (0.0 to 1.0),
      "sourceText": string or null
    }
  ],
  "diagnoses": [
    {
      "conditionName": string,
      "icd10Code": string or null,
      "status": "Active" | "Resolved" | "Suspected" | "Chronic" | "Unknown",
      "providerNotes": string or null,
      "confidence": number (0.0 to 1.0),
      "sourceText": string or null
    }
  ],
  "summaryEn": string (comprehensive plain-language explanation),
  "summaryHi": string or null (Hindi explanation),
  "keyFindings": [string],
  "abnormalHighlights": [string],
  "doctorQuestions": [string]
}
`;

/**
 * Utility to wait for milliseconds (used for exponential backoff on 429).
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));


/**
 * Calls Gemini API to extract structured data and generate summaries.
 * Validates output using Zod and reinforces deterministic reference-range calculations.
 * Includes retries with exponential backoff on rate-limits (429).
 */
export async function extractStructuredMedicalData(
  documentText: string,
  options?: ExtractionOptions
): Promise<{
  success: boolean;
  data?: MedicalExtractionPayload;
  error?: string;
  isMockFallback?: boolean;
}> {
  const ai = getGeminiClient(options?.apiKey);

  if (!ai) {
    return {
      success: false,
      error: 'GEMINI_API_KEY is not configured in the server environment. Please set GEMINI_API_KEY in .env.local to run live AI extraction.',
    };
  }

  const userPrompt = `
Extract structured medical information and produce an accessible summary from this medical document:

--- DOCUMENT START ---
${documentText}
--- DOCUMENT END ---

Please include ${options?.generateHindi !== false ? 'both English and Hindi summaries' : 'an English summary'}.
`;

  const models = FALLBACK_GEMINI_MODELS;
  let rawJsonResponse = '';
  let lastError: unknown = null;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        const response = await ai.models.generateContent({
          model,
          contents: [
            { role: 'user', parts: [{ text: MEDICAL_SYSTEM_PROMPT }, { text: userPrompt }] },
          ],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });

        rawJsonResponse = response.text || '';
        if (rawJsonResponse) {
          break; // success
        }
      } catch (err: unknown) {
        lastError = err;
        const errMsg = err instanceof Error ? err.message : '';

        // If rate limited (429), wait 2.5s and retry once
        if ((errMsg.includes('429') || /resource[_\s]exhausted/i.test(errMsg)) && attempts < maxAttempts) {
          await delay(2500);
          continue;
        }

        // If auth error or bad key, do not retry further models
        if (errMsg.includes('403') || /api[_\s]key[_\s]invalid/i.test(errMsg)) {
          return {
            success: false,
            error: formatGeminiError(err),
          };
        }

        // Check if error message suggests a specific alternative model
        const suggestedMatch = errMsg.match(/(?:suggesting|try|use)\s+['`"]?(gemini-[a-z0-9.-]+)['`"]?/i);
        if (suggestedMatch && suggestedMatch[1]) {
          const suggestedModel = suggestedMatch[1];
          if (!models.includes(suggestedModel)) {
            models.splice(i + 1, 0, suggestedModel);
          }
        }

        // Otherwise break attempt loop to try next model in chain
        break;
      }
    }

    if (rawJsonResponse) {
      break;
    }
  }

  if (!rawJsonResponse) {
    return {
      success: false,
      error: formatGeminiError(lastError),
    };
  }

  try {
    // Clean potential markdown wrappers
    let cleanJson = rawJsonResponse.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const parsedJson = JSON.parse(cleanJson);
    const validatedData = MedicalExtractionPayloadSchema.parse(parsedJson);

    // Apply deterministic reference-range validator to guarantee mathematical accuracy
    const deterministicObservations: ExtractedObservation[] = validatedData.observations.map((obs) => {
      if (obs.referenceRangeRaw) {
        const evalResult = evaluateObservationAgainstRange(obs.testResultValue, obs.referenceRangeRaw);
        return {
          ...obs,
          testResultNumeric: evalResult.numericValue !== null ? evalResult.numericValue : obs.testResultNumeric,
          referenceRangeLow: evalResult.low,
          referenceRangeHigh: evalResult.high,
          flag: evalResult.flag,
          flagSource: obs.flagSource === 'source_reported' ? 'source_reported' : 'calculated',
        };
      }
      return obs;
    });

    return {
      success: true,
      data: {
        ...validatedData,
        observations: deterministicObservations,
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'JSON validation failed';
    return {
      success: false,
      error: `Gemini produced unparseable clinical output: ${errorMsg}`,
    };
  }
}
