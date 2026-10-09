import { NextRequest, NextResponse } from 'next/server';
import { testGeminiConnectivity } from '@/lib/ai/geminiClient';

export async function POST(req: NextRequest) {
  try {
    let providedKey: string | undefined;
    try {
      const body = await req.json();
      providedKey = body?.apiKey;
    } catch {
      // Body may be empty when testing the server-configured environment key
    }

    const result = await testGeminiConnectivity(providedKey);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        model: result.model,
        latencyMs: result.latencyMs,
      });
    }

    const status = result.error?.includes('Invalid') ? 403 : 400;
    return NextResponse.json(
      {
        success: false,
        error: result.error,
      },
      { status }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Connection test failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

