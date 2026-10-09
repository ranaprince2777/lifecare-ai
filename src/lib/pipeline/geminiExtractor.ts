import { GoogleGenAI } from '@google/genai';
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
 * Calls Gemini API to extract structured data and generate summaries.
 * Validates output using Zod and reinforces deterministic reference-range calculations.
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
  const apiKey = options?.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return {
      success: false,
      error: 'GEMINI_API_KEY is not configured. Please add your API key in Settings or in .env.local to run live AI extraction.',
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const userPrompt = `
Extract structured medical information and produce an accessible summary from this medical document:

--- DOCUMENT START ---
${documentText}
--- DOCUMENT END ---

Please include ${options?.generateHindi !== false ? 'both English and Hindi summaries' : 'an English summary'}.
`;

    // Try gemini-2.5-flash, fallback to gemini-1.5-flash
    let rawJsonResponse = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: MEDICAL_SYSTEM_PROMPT }, { text: userPrompt }] }
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1, // low temperature for medical accuracy
        },
      });
      rawJsonResponse = response.text || '';
    } catch {
      // Fallback to gemini-1.5-flash if 2.5 is unavailable
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [
          { role: 'user', parts: [{ text: MEDICAL_SYSTEM_PROMPT }, { text: userPrompt }] }
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });
      rawJsonResponse = fallbackResponse.text || '';
    }

    if (!rawJsonResponse) {
      return {
        success: false,
        error: 'Gemini returned an empty response. Please retry.',
      };
    }

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
    const errorMsg = err instanceof Error ? err.message : 'Unknown AI extraction error';
    return {
      success: false,
      error: `AI extraction error: ${errorMsg}`,
    };
  }
}
