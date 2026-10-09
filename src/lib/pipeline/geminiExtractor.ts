import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import {
  MedicalExtractionPayload,
  MedicalExtractionPayloadSchema,
  ExtractedObservation,
} from '../types/medical';
import { evaluateObservationAgainstRange } from './referenceRangeValidator';

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
 * Parses and categorizes Gemini API errors into helpful actionable messages.
 */
function parseGeminiError(err: unknown): string {
  if (!(err instanceof Error)) return 'Unknown Gemini API error occurred.';
  const msg = err.message || '';

  if (msg.includes('429') || /resource[_\s]exhausted|rate[_\s]limit/i.test(msg)) {
    return 'Gemini API rate limit reached (429). Please wait a moment before trying again.';
  }
  if (msg.includes('403') || /api[_\s]key[_\s]invalid|unauthenticated|permission[_\s]denied/i.test(msg)) {
    return 'Invalid Gemini API key. Please check that your key in .env.local or Settings is valid and has Gemini API enabled in Google AI Studio.';
  }
  if (/quota|bill/i.test(msg)) {
    return 'Gemini API quota exceeded for this key. Please check your usage on Google AI Studio.';
  }

  return `Gemini API error: ${msg}`;
}

function getEffectiveKey(providedKey?: string): string | undefined {
  if (providedKey && providedKey.trim()) return providedKey.trim();
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) return process.env.GEMINI_API_KEY.trim();
  if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY.trim()) return process.env.GOOGLE_API_KEY.trim();
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const match = content.match(/^GEMINI_API_KEY=(.*)$/m);
      if (match && match[1].trim() && match[1].trim() !== 'your_gemini_api_key_here') {
        return match[1].trim();
      }
    }
  } catch {
    // ignore
  }
  return undefined;
}

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
  const apiKey = getEffectiveKey(options?.apiKey);

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return {
      success: false,
      error: 'GEMINI_API_KEY is not configured. Please add your API key in .env.local or in Settings to run live AI extraction.',
    };
  }

  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
  const userPrompt = `
Extract structured medical information and produce an accessible summary from this medical document:

--- DOCUMENT START ---
${documentText}
--- DOCUMENT END ---

Please include ${options?.generateHindi !== false ? 'both English and Hindi summaries' : 'an English summary'}.
`;

  // Models to attempt in order of preference: prefer gemini-3.1-flash-lite, fallback to 3.1-flash, 3.5, 3.8
  const models = [
    'gemini-3.1-flash-lite',
    'gemini-3.1-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.8-flash',
  ];
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
            error: parseGeminiError(err),
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
      error: parseGeminiError(lastError),
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
