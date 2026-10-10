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

  // Inspect magic bytes & validate file signature
  const isPdfMagic = buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
  const isPngMagic = buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  const isJpgMagic = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

  const ext = fileName.split('.').pop()?.toLowerCase();
  const claimsPdf = ext === 'pdf' || providedMimeType?.toLowerCase() === 'application/pdf';
  const claimsPng = ext === 'png' || providedMimeType?.toLowerCase() === 'image/png';
  const claimsJpg = ext === 'jpg' || ext === 'jpeg' || providedMimeType?.toLowerCase() === 'image/jpeg';
  let detectedMime = providedMimeType?.toLowerCase() || '';

  if (claimsPdf) {
    if (!isPdfMagic) {
      return {
        isValid: false,
        error: 'The uploaded file is not a valid PDF document. Please upload an uncorrupted PDF.',
        sizeBytes,
      };
    }
    detectedMime = 'application/pdf';
  } else if (claimsPng) {
    if (!isPngMagic) {
      return {
        isValid: false,
        error: 'The uploaded file is not a valid PNG image. Please upload an uncorrupted PNG.',
        sizeBytes,
      };
    }
    detectedMime = 'image/png';
  } else if (claimsJpg) {
    if (!isJpgMagic) {
      return {
        isValid: false,
        error: 'The uploaded file is not a valid JPEG image. Please upload an uncorrupted JPEG.',
        sizeBytes,
      };
    }
    detectedMime = 'image/jpeg';
  } else if (isPdfMagic) {
    detectedMime = 'application/pdf';
  } else if (isPngMagic) {
    detectedMime = 'image/png';
  } else if (isJpgMagic) {
    detectedMime = 'image/jpeg';
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
