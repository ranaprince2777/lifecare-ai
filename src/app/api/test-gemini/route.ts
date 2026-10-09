import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();
    const effectiveKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!effectiveKey) {
      return NextResponse.json(
        { success: false, error: 'No API key provided or found in environment variables.' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: effectiveKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Respond with the single word: "READY"',
    });

    const reply = response.text?.trim() || '';
    if (reply) {
      return NextResponse.json({
        success: true,
        message: 'Successfully connected to Google Gemini API!',
        model: 'gemini-2.5-flash',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Empty response received from Gemini.' },
      { status: 500 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Connection test failed';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
