import { describe, it, expect } from 'vitest';
import { assessTextQuality, extractDocumentText } from '../pipeline/textExtractor';
import fs from 'fs';
import path from 'path';

describe('Text Extractor & Quality Assessment', () => {
  it('correctly assesses usable clinical text', () => {
    const text = 'Patient Vikram Patel Fasting Blood Glucose 112 mg/dL Hemoglobin 14.2 g/dL Normal';
    const assessment = assessTextQuality(text);
    expect(assessment.isUsable).toBe(true);
    expect(assessment.reason).toBeUndefined();
  });

  it('rejects empty or whitespace-only text', () => {
    const assessment = assessTextQuality('    \n\t  ');
    expect(assessment.isUsable).toBe(false);
  });

  it('rejects insufficient text under 25 characters', () => {
    const assessment = assessTextQuality('Blood test');
    expect(assessment.isUsable).toBe(false);
    expect(assessment.reason).toContain('insufficient');
  });

  it('rejects garbage non-alphanumeric text', () => {
    const assessment = assessTextQuality('$$$ ### @@@ !!! %%% ^^^ &&& *** ((( )))');
    expect(assessment.isUsable).toBe(false);
    expect(assessment.reason).toContain('lacks recognizable alphanumeric words');
  });

  it('extracts embedded digital text from PDF files using pure-JS engine', async () => {
    const samplePdfPath = path.join(process.cwd(), 'public', 'sample_lab_report.pdf');
    if (fs.existsSync(samplePdfPath)) {
      const buffer = fs.readFileSync(samplePdfPath);
      const result = await extractDocumentText(buffer, 'application/pdf', 'sample_lab_report.pdf');
      expect(result.success).toBe(true);
      expect(result.method).toBe('pdf_embedded');
      expect(result.text.length).toBeGreaterThan(100);
      expect(result.text).toContain('CITY DIAGNOSTIC CLINIC');
    }
  });

  it('handles unsupported MIME types with appropriate error', async () => {
    const dummyBuffer = Buffer.from('test binary data');
    const result = await extractDocumentText(dummyBuffer, 'audio/mp3', 'audio.mp3');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unsupported MIME type');
  });
});
