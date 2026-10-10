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
 * Converts raw RGB/RGBA pixel data into a standard 24-bit uncompressed Windows BMP buffer
 * for consumption by Tesseract.js Leptonica image decoder without external canvas dependencies.
 */
function rgbaToBmp(
  data: Uint8Array | Uint8ClampedArray | Buffer,
  width: number,
  height: number,
  isRgba = false
): Buffer {
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;
  const buf = Buffer.alloc(fileSize);

  // BM header
  buf.write('BM', 0);
  buf.writeUInt32LE(fileSize, 2);
  buf.writeUInt32LE(54, 10);

  // DIB header
  buf.writeUInt32LE(40, 14);
  buf.writeInt32LE(width, 18);
  buf.writeInt32LE(height, 22);
  buf.writeUInt16LE(1, 26);
  buf.writeUInt16LE(24, 28);
  buf.writeUInt32LE(0, 30);
  buf.writeUInt32LE(pixelArraySize, 34);

  const step = isRgba ? 4 : 3;
  for (let y = 0; y < height; y++) {
    const srcRow = (height - 1 - y) * width * step;
    const dstRow = 54 + y * rowSize;
    for (let x = 0; x < width; x++) {
      const srcIdx = srcRow + x * step;
      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];
      const dstIdx = dstRow + x * 3;
      buf[dstIdx] = b;
      buf[dstIdx + 1] = g;
      buf[dstIdx + 2] = r;
    }
  }
  return buf;
}

/**
 * Extracts text from PDF using unpdf in pure JavaScript (serverless & Edge compatible).
 * Automatically extracts embedded raster images and falls back to OCR if the PDF is scanned.
 */
async function extractWithUnPdf(buffer: Buffer): Promise<TextExtractionResult> {
  try {
    const { extractText, extractImages } = await import('unpdf');
    const bufferCopy = Buffer.from(buffer);
    const uint8 = new Uint8Array(bufferCopy.buffer, bufferCopy.byteOffset, bufferCopy.byteLength);

    const res = await extractText(uint8);
    const fullText = (res.text || []).join('\n\n').trim();
    const digitalQuality = assessTextQuality(fullText);

    if (digitalQuality.isUsable) {
      return {
        success: true,
        text: fullText,
        method: 'pdf_embedded',
        pageCount: res.totalPages,
        insufficientText: false,
      };
    }

    // If digital text is empty or unreadable (< 25 chars), inspect page raster images for OCR
    let combinedOcrText = '';
    let hasScannedImages = false;
    const maxPages = Math.min(res.totalPages || 1, 3);

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        const images = await extractImages(uint8, pageNum);
        if (images && images.length > 0) {
          hasScannedImages = true;
          // Select the primary image with highest resolution
          const primaryImg = images.reduce((prev, curr) =>
            curr.width * curr.height > prev.width * prev.height ? curr : prev
          );
          const isRgba = primaryImg.channels === 4;
          const bmpBuf = rgbaToBmp(primaryImg.data, primaryImg.width, primaryImg.height, isRgba);
          const ocrRes = await extractImageWithTesseract(bmpBuf);
          if (ocrRes.success && ocrRes.text) {
            combinedOcrText += (combinedOcrText ? '\n\n' : '') + ocrRes.text;
          }
        }
      } catch {
        // Continue to next page
      }
    }

    if (combinedOcrText) {
      const ocrQuality = assessTextQuality(combinedOcrText);
      if (ocrQuality.isUsable) {
        return {
          success: true,
          text: combinedOcrText,
          method: 'ocr_tesseract',
          pageCount: res.totalPages,
          insufficientText: false,
        };
      }
    }

    return {
      success: false,
      text: fullText,
      method: hasScannedImages ? 'ocr_tesseract' : 'pdf_embedded',
      pageCount: res.totalPages,
      insufficientText: true,
      error: digitalQuality.reason || 'PDF contains insufficient readable text.',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown unpdf error';
    return {
      success: false,
      text: '',
      method: 'pdf_embedded',
      error: errorMsg,
      insufficientText: true,
    };
  }
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
    // Dynamic import to support both ESM, CommonJS, and pdf-parse v2 API
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfModule = require('pdf-parse');
    let text = '';
    let pageCount = 1;

    if (typeof pdfModule === 'function') {
      const data = await pdfModule(buffer);
      text = data.text || '';
      pageCount = data.numpages || 1;
    } else if (pdfModule?.PDFParse) {
      // Clone buffer to prevent PDFParse worker from detaching the original ArrayBuffer
      const bufferCopy = Buffer.from(buffer);
      const uint8 = new Uint8Array(bufferCopy.buffer, bufferCopy.byteOffset, bufferCopy.byteLength);
      const parser = new pdfModule.PDFParse(uint8);
      const res = await parser.getText();
      text = typeof res === 'string' ? res : (res?.text || '');
      pageCount = res?.total || res?.pages?.length || 1;
    } else {
      throw new Error('Unsupported pdf-parse module structure');
    }

    const quality = assessTextQuality(text);

    return {
      success: quality.isUsable,
      text,
      method: 'pdf_embedded',
      pageCount,
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
 * Directs PDFs to embedded extractors (pdfjs-dist / pdf-parse / PyMuPDF)
 * Directs Images to Tesseract OCR
 */
export async function extractDocumentText(
  buffer: Buffer,
  mimeType: string,
  originalFileName: string
): Promise<TextExtractionResult> {
  if (mimeType === 'application/pdf') {
    // 1. Primary pure-JS extraction with automatic raster OCR fallback via unpdf
    const unPdfResult = await extractWithUnPdf(buffer);
    if (unPdfResult.success && unPdfResult.text.trim().length > 25) {
      return unPdfResult;
    }

    // 2. Secondary attempt via PyMuPDF (if Python is present on host)
    const tempFilePath = path.join(os.tmpdir(), `lifecare_${Date.now()}_${path.basename(originalFileName)}`);
    try {
      await fs.promises.writeFile(tempFilePath, buffer);
      const pyResult = await extractWithPyMuPDF(tempFilePath);
      if (pyResult.success && pyResult.text.trim().length > 25) {
        return pyResult;
      }
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
          // fall through
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

    // 3. Third Node-native fallback
    const nodeResult = await extractWithPdfParse(buffer);
    if (nodeResult.success && nodeResult.text.trim().length > 25) {
      return nodeResult;
    }

    // If all extraction attempts returned insufficient text, return explicit notice
    return {
      success: false,
      text: unPdfResult.text || nodeResult.text || '',
      method: unPdfResult.method || 'pdf_embedded',
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
