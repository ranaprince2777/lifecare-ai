import { ExtractionMethod } from '../types/medical';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

export interface TextExtractionResult {
  success: boolean;
  text: string;
  method: ExtractionMethod;
  pageCount?: number;
  confidence?: number;
  error?: string;
  insufficientText?: boolean;
  pageImageBase64?: string;
}

/**
 * Assesses extracted text quality to distinguish real medical content from corrupted or blank scans.
 */
export function assessTextQuality(rawText: string): { isUsable: boolean; reason?: string } {
  if (!rawText) return { isUsable: false, reason: 'No text extracted' };

  const cleaned = rawText.replace(/\s+/g, ' ').trim();
  if (cleaned.length < 25) {
    return {
      isUsable: false,
      reason: `Extracted text contains only ${cleaned.length} characters, which is insufficient for clinical interpretation.`,
    };
  }

  // Count alphanumeric characters vs garbage
  const alphaNumeric = cleaned.replace(/[^a-zA-Z0-9]/g, '');
  if (alphaNumeric.length < 15) {
    return {
      isUsable: false,
      reason: 'Extracted text lacks recognizable alphanumeric words or clinical terminology.',
    };
  }

  return { isUsable: true };
}

/**
 * Extracts text from PDF using PyMuPDF via Python script.
 */
async function extractWithPyMuPDF(filePath: string): Promise<TextExtractionResult> {
  return new Promise((resolve) => {
    const scriptPath = path.join(process.cwd(), 'scripts', 'extract_pdf.py');
    const pyProcess = spawn('python', [scriptPath, filePath]);

    let stdoutData = '';
    let stderrData = '';

    pyProcess.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    pyProcess.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    pyProcess.on('close', (code) => {
      if (code === 0 && stdoutData) {
        try {
          const parsed = JSON.parse(stdoutData);
          if (parsed.success && parsed.text) {
            const quality = assessTextQuality(parsed.text);
            return resolve({
              success: quality.isUsable,
              text: parsed.text,
              method: 'pymupdf',
              pageCount: parsed.pageCount,
              insufficientText: !quality.isUsable,
              error: quality.isUsable ? undefined : quality.reason,
              pageImageBase64: parsed.pageImageBase64,
            });
          }
          if (parsed.isScanned && parsed.pageImageBase64) {
            return resolve({
              success: false,
              text: '',
              method: 'pymupdf',
              pageCount: parsed.pageCount,
              insufficientText: true,
              pageImageBase64: parsed.pageImageBase64,
            });
          }
        } catch {
          // Fall through
        }
      }

      resolve({
        success: false,
        text: '',
        method: 'pymupdf',
        error: stderrData || 'PyMuPDF execution failed.',
      });
    });

    pyProcess.on('error', (err) => {
      resolve({
        success: false,
        text: '',
        method: 'pymupdf',
        error: `Python process failed to spawn: ${err.message}`,
      });
    });
  });
}

/**
 * Extracts text from PDF using pdf-parse library as a Node fallback.
 */
async function extractWithPdfParse(buffer: Buffer): Promise<TextExtractionResult> {
  try {
    // Dynamic import to support both ESM and CommonJS
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    const text = data.text || '';
    const quality = assessTextQuality(text);

    return {
      success: quality.isUsable,
      text,
      method: 'pdf_embedded',
      pageCount: data.numpages,
      insufficientText: !quality.isUsable,
      error: quality.isUsable ? undefined : quality.reason,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown pdf-parse error';
    return {
      success: false,
      text: '',
      method: 'pdf_embedded',
      error: errorMsg,
    };
  }
}

/**
 * Extracts text from an image (PNG, JPG) using Tesseract.js OCR.
 */
async function extractImageWithTesseract(buffer: Buffer): Promise<TextExtractionResult> {
  try {
    const { createWorker } = await import('tesseract.js');
    const workerPath = path.join(
      process.cwd(),
      'node_modules',
      'tesseract.js',
      'src',
      'worker-script',
      'node',
      'index.js'
    );
    const worker = await createWorker('eng', 1, {
      workerPath: fs.existsSync(workerPath) ? workerPath : undefined,
    });
    const ret = await worker.recognize(buffer);
    await worker.terminate();

    const text = ret.data.text || '';
    const confidence = ret.data.confidence;
    const quality = assessTextQuality(text);

    return {
      success: quality.isUsable,
      text,
      method: 'ocr_tesseract',
      confidence: confidence ? confidence / 100 : undefined,
      insufficientText: !quality.isUsable,
      error: quality.isUsable ? undefined : quality.reason,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Tesseract OCR failed';
    return {
      success: false,
      text: '',
      method: 'ocr_tesseract',
      error: errorMsg,
    };
  }
}

/**
 * Primary text extraction router:
 * Directs PDFs to embedded extractors (pdf-parse / PyMuPDF)
 * Directs Images to Tesseract OCR
 */
export async function extractDocumentText(
  buffer: Buffer,
  mimeType: string,
  originalFileName: string
): Promise<TextExtractionResult> {
  if (mimeType === 'application/pdf') {
    // 1. First attempt Node-native pdf-parse
    const nodeResult = await extractWithPdfParse(buffer);
    if (nodeResult.success && nodeResult.text.trim().length > 30) {
      return nodeResult;
    }

    // 2. Second attempt via PyMuPDF with temporary file
    const tempFilePath = path.join(os.tmpdir(), `lifecare_${Date.now()}_${path.basename(originalFileName)}`);
    try {
      await fs.promises.writeFile(tempFilePath, buffer);
      const pyResult = await extractWithPyMuPDF(tempFilePath);
      if (pyResult.success && pyResult.text.trim().length > 30) {
        return pyResult;
      }
      if (pyResult.text && pyResult.text.trim().length > 0) {
        return pyResult;
      }

      // 3. Third attempt: Scanned PDF automatic OCR
      if (pyResult.pageImageBase64) {
        try {
          const imgBuffer = Buffer.from(pyResult.pageImageBase64, 'base64');
          const ocrResult = await extractImageWithTesseract(imgBuffer);
          if (ocrResult.success) {
            return {
              ...ocrResult,
              method: 'ocr_tesseract',
              pageCount: pyResult.pageCount || 1,
            };
          }
        } catch {
          // fall through to error notice
        }
      }
    } catch {
      // ignore temp file write error
    } finally {
      try {
        if (fs.existsSync(tempFilePath)) {
          await fs.promises.unlink(tempFilePath);
        }
      } catch {
        // cleanup ignore
      }
    }

    // If both returned minimal or empty text, return explicit notice
    return {
      success: false,
      text: nodeResult.text || '',
      method: 'pdf_embedded',
      insufficientText: true,
      error: 'The uploaded PDF appears to be a scanned image or empty. Please ensure the document contains readable text or upload a clear photo/scan.',
    };
  }

  if (mimeType.startsWith('image/')) {
    return await extractImageWithTesseract(buffer);
  }

  return {
    success: false,
    text: '',
    method: 'manual_fallback',
    error: `Unsupported MIME type for text extraction: ${mimeType}`,
  };
}
