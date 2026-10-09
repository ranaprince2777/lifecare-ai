import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ENV_LOCAL_PATH = path.join(process.cwd(), '.env.local');

function getStoredKey(): string | null {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    return process.env.GEMINI_API_KEY.trim();
  }
  if (fs.existsSync(ENV_LOCAL_PATH)) {
    const content = fs.readFileSync(ENV_LOCAL_PATH, 'utf-8');
    const match = content.match(/^GEMINI_API_KEY=(.*)$/m);
    if (match && match[1].trim()) {
      return match[1].trim();
    }
  }
  return null;
}

export async function GET() {
  const key = getStoredKey();
  if (key && key !== 'your_gemini_api_key_here') {
    return NextResponse.json({
      configured: true,
      keyLength: key.length,
    });
  }
  return NextResponse.json({
    configured: false,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();

    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      return NextResponse.json(
        { success: false, error: 'Please provide a non-empty API key string.' },
        { status: 400 }
      );
    }

    const cleanKey = apiKey.trim();

    // Read existing .env.local or create new
    let content = '';
    if (fs.existsSync(ENV_LOCAL_PATH)) {
      content = fs.readFileSync(ENV_LOCAL_PATH, 'utf-8');
    }

    if (/^GEMINI_API_KEY=.*$/m.test(content)) {
      content = content.replace(/^GEMINI_API_KEY=.*$/m, `GEMINI_API_KEY=${cleanKey}`);
    } else {
      content += `\nGEMINI_API_KEY=${cleanKey}\n`;
    }

    fs.writeFileSync(ENV_LOCAL_PATH, content.trim() + '\n', 'utf-8');
    process.env.GEMINI_API_KEY = cleanKey;

    return NextResponse.json({
      success: true,
      message: 'Gemini API key saved to server .env.local successfully.',
      keyLength: cleanKey.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save key';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    if (fs.existsSync(ENV_LOCAL_PATH)) {
      let content = fs.readFileSync(ENV_LOCAL_PATH, 'utf-8');
      content = content.replace(/^GEMINI_API_KEY=.*$/m, 'GEMINI_API_KEY=');
      fs.writeFileSync(ENV_LOCAL_PATH, content.trim() + '\n', 'utf-8');
    }
    delete process.env.GEMINI_API_KEY;

    return NextResponse.json({
      success: true,
      message: 'Gemini API key removed from server .env.local.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to clear key';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
