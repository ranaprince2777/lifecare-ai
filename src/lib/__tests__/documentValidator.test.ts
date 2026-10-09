import { describe, it, expect } from 'vitest';
import { validateDocument, MAX_FILE_SIZE_BYTES } from '../pipeline/documentValidator';

describe('Document Validator', () => {
  it('should reject empty buffers', () => {
    const emptyBuf = Buffer.alloc(0);
    const result = validateDocument(emptyBuf, 'test.pdf', 'application/pdf');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('empty');
  });

  it('should reject files exceeding 10MB', () => {
    const largeBuf = Buffer.alloc(MAX_FILE_SIZE_BYTES + 1024);
    const result = validateDocument(largeBuf, 'large.pdf', 'application/pdf');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('exceeds maximum allowed limit');
  });

  it('should validate valid PDF buffers and compute hash', () => {
    // PDF magic bytes: %PDF
    const pdfBuf = Buffer.from('%PDF-1.4 sample content for clinical report');
    const result = validateDocument(pdfBuf, 'report.pdf', 'application/pdf');
    expect(result.isValid).toBe(true);
    expect(result.mimeType).toBe('application/pdf');
    expect(result.fileHash).toBeDefined();
    expect(typeof result.fileHash).toBe('string');
    expect(result.fileHash?.length).toBe(64); // SHA-256 hex length
  });

  it('should validate PNG files from magic bytes', () => {
    // PNG magic bytes: \x89PNG
    const pngBuf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const result = validateDocument(pngBuf, 'scan.png', 'image/png');
    expect(result.isValid).toBe(true);
    expect(result.mimeType).toBe('image/png');
  });

  it('should reject unsupported formats', () => {
    const exeBuf = Buffer.from('MZ executable binary code here');
    const result = validateDocument(exeBuf, 'virus.exe', 'application/x-msdownload');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Unsupported file format');
  });
});
