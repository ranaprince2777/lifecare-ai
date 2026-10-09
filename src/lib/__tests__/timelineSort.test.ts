import { describe, it, expect } from 'vitest';
import { DEMO_RECORDS } from '../demo/fixtures';

describe('Timeline Sorting and Chronological Sequence', () => {
  it('should correctly sort records newest to oldest by documentDate with upload fallback', () => {
    const sorted = [...DEMO_RECORDS].sort((a, b) => {
      const dateA = new Date(a.documentDate || a.uploadedAt).getTime();
      const dateB = new Date(b.documentDate || b.uploadedAt).getTime();
      return dateB - dateA;
    });

    expect(sorted.length).toBe(4);
    // Newest is 2026-03-18 (Prescription)
    expect(sorted[0].documentDate).toBe('2026-03-18');
    // Oldest is 2025-11-22 (Discharge Summary)
    expect(sorted[sorted.length - 1].documentDate).toBe('2025-11-22');
  });

  it('should filter records by document type correctly', () => {
    const labReports = DEMO_RECORDS.filter((r) => r.documentType === 'Lab Report');
    expect(labReports.length).toBe(1);
    expect(labReports[0].fileName).toContain('Comprehensive_Metabolic_Lipid');

    const prescriptions = DEMO_RECORDS.filter((r) => r.documentType === 'Prescription');
    expect(prescriptions.length).toBe(1);
    expect(prescriptions[0].medications.length).toBe(3);
  });
});
