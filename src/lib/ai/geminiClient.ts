import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

export const PRIMARY_GEMINI_MODEL = 'gemini-3.1-flash-lite';
export const FALLBACK_GEMINI_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.1-flash',
  'gemini-2.5-flash',
  'gemini-1.5-flash',
];

let cachedClient: GoogleGenAI | null = null;
let cachedKey: string | null = null;

/**
 * Resolves the server-side Gemini API key securely.
 * Checks process.env first, then local .env.local fallback for local scripts/server environments.
 * Never exposes the key string to client code.
 */
export function getServerGeminiApiKey(): string | undefined {
  // 1. Standard process.env
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    const key = process.env.GEMINI_API_KEY.trim();
    if (key !== 'your_gemini_api_key_here') return key;
  }

  if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY.trim()) {
    const key = process.env.GOOGLE_API_KEY.trim();
    if (key !== 'your_gemini_api_key_here') return key;
  }

  // 2. Fallback read from .env.local (safe server-side filesystem operation)
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
    // Ignore read errors
  }

  return undefined;
}

/**
 * Returns a singleton instance of GoogleGenAI initialized with the server key.
 * Caches the client instance to avoid repeated initialization overhead across requests.
 */
export function getGeminiClient(customKey?: string): GoogleGenAI | null {
  const effectiveKey = customKey?.trim() || getServerGeminiApiKey();
  if (!effectiveKey) return null;

  if (cachedClient && cachedKey === effectiveKey) {
    return cachedClient;
  }

  cachedKey = effectiveKey;
  cachedClient = new GoogleGenAI({ apiKey: effectiveKey });
  return cachedClient;
}

/**
 * Returns safe server-side configuration status for UI display without leaking credentials.
 */
export function getGeminiConfigStatus(): {
  configured: boolean;
  statusText: 'AI Service Configured' | 'AI Service Not Configured';
  keyLength: number | null;
  primaryModel: string;
} {
  const key = getServerGeminiApiKey();
  const isConfigured = Boolean(key && key.length > 10);

  return {
    configured: isConfigured,
    statusText: isConfigured ? 'AI Service Configured' : 'AI Service Not Configured',
    keyLength: isConfigured && key ? key.length : null,
    primaryModel: PRIMARY_GEMINI_MODEL,
  };
}

/**
 * Standardized, safe error message formatter that prevents credential exposure.
 */
export function formatGeminiError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);

  if (msg.includes('API_KEY_INVALID') || msg.includes('403') || msg.includes('API key not valid')) {
    return 'Invalid Gemini API key. Please verify that your API key in server .env.local is active and correctly configured in Google AI Studio.';
  }
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('Quota exceeded')) {
    return 'Google Gemini API rate limit or quota exceeded. Please wait a moment before trying again.';
  }
  if (msg.includes('fetch failed') || msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED')) {
    return 'Network connection error while contacting Google Gemini API. Please check your internet connection.';
  }
  if (msg.includes('SAFETY') || msg.includes('blocked')) {
    return 'Content flagged by Gemini safety filters. Please review document content.';
  }

  return `Gemini API error: ${msg}`;
}

/**
 * Performs a lightweight live connectivity test against Google Gemini API.
 */
export async function testGeminiConnectivity(customKey?: string): Promise<{
  success: boolean;
  connected: boolean;
  model?: string;
  latencyMs?: number;
  message?: string;
  error?: string;
}> {
  const keyToTest = customKey?.trim() || getServerGeminiApiKey();

  if (!keyToTest) {
    return {
      success: false,
      connected: false,
      error: 'GEMINI_API_KEY is not configured in server environment variables. Please add it to your server .env.local.',
    };
  }

  const ai = new GoogleGenAI({ apiKey: keyToTest });
  const start = Date.now();
  let lastError = '';

  for (const model of FALLBACK_GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: 'Ping test for clinical AI copilot health check. Respond strictly with: PONG',
      });

      if (response && response.text) {
        const latencyMs = Date.now() - start;
        return {
          success: true,
          connected: true,
          model,
          latencyMs,
          message: `Successfully connected to Google Gemini API using model "${model}" (${latencyMs}ms)!`,
        };
      }
    } catch (err: unknown) {
      lastError = formatGeminiError(err);
      // If error is specifically invalid key, do not keep trying other models
      if (lastError.includes('Invalid Gemini API key') || lastError.includes('403')) {
        return {
          success: false,
          connected: false,
          error: lastError,
        };
      }
    }
  }

  return {
    success: false,
    connected: false,
    error: lastError || 'Unable to connect to any Gemini model.',
  };
}
