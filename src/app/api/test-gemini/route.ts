import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

/**
 * Helper to read GEMINI_API_KEY from .env.local if not already in process.env
 */
function getEffectiveKey(providedKey?: string): string | undefined {
  if (providedKey && providedKey.trim()) {
    return providedKey.trim();
  }
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    return process.env.GEMINI_API_KEY.trim();
  }
  if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY.trim()) {
    return process.env.GOOGLE_API_KEY.trim();
  }

  // Fallback: inspect .env.local on disk
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const match = content.match(/^GEMINI_API_KEY=(.*)$/m);
      if (match && match[1].trim()) {
        return match[1].trim();
      }
    }
  } catch {
    // ignore
  }

  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    let providedKey: string | undefined;
    try {
      const body = await req.json();
      providedKey = body?.apiKey;
    } catch {
      // Body may be empty if testing server key
    }

    const effectiveKey = getEffectiveKey(providedKey);

    if (!effectiveKey || effectiveKey === 'your_gemini_api_key_here') {
      return NextResponse.json(
        {
          success: false,
          error: 'No Gemini API key found. Please save your key in .env.local or enter it in the input field above.',
        },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: effectiveKey });

    // Models in order of preference: prefer gemini-3.1-flash-lite, fallback to 3.1-flash, 3.5, 3.8
    const modelsToTry = [
      'gemini-3.1-flash-lite',
      'gemini-3.1-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-3.8-flash',
    ];

    let lastError: string | null = null;

    for (let i = 0; i < modelsToTry.length; i++) {
      const model = modelsToTry[i];
      try {
        const response = await ai.models.generateContent({
          model,
          contents: 'Respond with the single word: "READY"',
        });

        const reply = response.text?.trim() || '';
        if (reply) {
          return NextResponse.json({
            success: true,
            message: `Successfully connected to Google Gemini API using model "${model}"!`,
            model,
          });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        lastError = msg;

        // If the key itself is invalid (400/403), no need to try further models
        if (msg.includes('403') || /api[_\s]key[_\s]invalid|unauthenticated|permission[_\s]denied/i.test(msg)) {
          return NextResponse.json(
            {
              success: false,
              error: 'Invalid API key. Please verify that your Gemini API key from Google AI Studio is active and correctly entered.',
            },
            { status: 403 }
          );
        }

        // If the error message suggests a specific alternative model (e.g. "suggesting gemini-3.1-flash")
        const suggestedMatch = msg.match(/(?:suggesting|try|use)\s+['`"]?(gemini-[a-z0-9.-]+)['`"]?/i);
        if (suggestedMatch && suggestedMatch[1]) {
          const suggestedModel = suggestedMatch[1];
          if (!modelsToTry.includes(suggestedModel)) {
            modelsToTry.splice(i + 1, 0, suggestedModel);
          }
        }

        // If rate limit (429), report rate limit
        if (msg.includes('429') || /resource[_\s]exhausted|rate[_\s]limit/i.test(msg)) {
          return NextResponse.json(
            {
              success: false,
              error: `Gemini API rate limit reached (429) for model "${model}". Please retry in a few moments.`,
            },
            { status: 429 }
          );
        }
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: `Could not connect to Gemini models (${modelsToTry.join(', ')}): ${lastError || 'Unknown error'}`,
      },
      { status: 400 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Connection test failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
