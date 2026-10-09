import { createHash } from 'crypto';

export interface DocumentValidationResult {
  isValid: boolean;
  error?: string;
  fileHash?: string;
  mimeType?: string;
  sizeBytes?: number;
}

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Validates document buffer, mime type, and file size.
 * Calculates cryptographic SHA-256 hash for duplicate protection.
 */
export function validateDocument(
  buffer: Buffer,
  fileName: string,
  providedMimeType?: string
): DocumentValidationResult {
  if (!buffer || buffer.length === 0) {
    return {
      isValid: false,
      error: 'The uploaded file is empty (0 bytes). Please select a valid document.',
    };
  }

  const sizeBytes = buffer.length;
  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File size (${sizeMb} MB) exceeds maximum allowed limit of 10 MB.`,
      sizeBytes,
    };
  }

  // Detect mime type from signature / header if possible
  let detectedMime = providedMimeType?.toLowerCase() || '';
  const ext = fileName.split('.').pop()?.toLowerCase();

  // Inspect magic bytes
  if (buffer.length >= 4) {
    // PDF: %PDF (25 50 44 46)
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
      detectedMime = 'application/pdf';
    }
    // PNG: 89 50 4E 47
    else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      detectedMime = 'image/png';
    }
    // JPEG: FF D8 FF
    else if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      detectedMime = 'image/jpeg';
    }
  }

  // Check extension fallback
  if (!detectedMime) {
    if (ext === 'pdf') detectedMime = 'application/pdf';
    else if (ext === 'jpg' || ext === 'jpeg') detectedMime = 'image/jpeg';
    else if (ext === 'png') detectedMime = 'image/png';
  }

  if (!ALLOWED_MIME_TYPES.includes(detectedMime)) {
    return {
      isValid: false,
      error: `Unsupported file format (${detectedMime || ext || 'unknown'}). Supported formats: PDF, JPG, JPEG, and PNG.`,
      sizeBytes,
    };
  }

  // Compute SHA-256 hash
  const fileHash = createHash('sha256').update(buffer).digest('hex');

  return {
    isValid: true,
    fileHash,
    mimeType: detectedMime,
    sizeBytes,
  };
}
