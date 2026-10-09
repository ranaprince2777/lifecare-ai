import { describe, it, expect } from 'vitest';
import {
  parseNumericValue,
  parseReferenceRange,
  evaluateObservationAgainstRange,
} from '../pipeline/referenceRangeValidator';

describe('Deterministic Reference Range Validator', () => {
  describe('parseNumericValue', () => {
    it('should correctly parse clean float and integer strings', () => {
      expect(parseNumericValue('142.0')).toBe(142.0);
      expect(parseNumericValue('6.8')).toBe(6.8);
      expect(parseNumericValue('95')).toBe(95);
    });

    it('should strip commas and trailing units', () => {
      expect(parseNumericValue('1,250 mg/dL')).toBe(1250);
      expect(parseNumericValue('15.6 cm')).toBe(15.6);
    });

    it('should handle inequality prefixes', () => {
      expect(parseNumericValue('<0.05')).toBe(0.05);
      expect(parseNumericValue('> 60')).toBe(60);
    });

    it('should return null for non-numeric strings', () => {
      expect(parseNumericValue('Negative')).toBeNull();
      expect(parseNumericValue(null)).toBeNull();
      expect(parseNumericValue('')).toBeNull();
    });
  });

  describe('parseReferenceRange', () => {
    it('should parse standard low-high intervals', () => {
      const res = parseReferenceRange('70.0 - 99.0');
      expect(res.low).toBe(70.0);
      expect(res.high).toBe(99.0);
      expect(res.isUpperBoundOnly).toBe(false);
    });

    it('should parse upper-bound inequalities', () => {
      const res = parseReferenceRange('< 200.0');
      expect(res.low).toBeNull();
      expect(res.high).toBe(200.0);
      expect(res.isUpperBoundOnly).toBe(true);
    });

    it('should parse lower-bound inequalities', () => {
      const res = parseReferenceRange('> 60.0');
      expect(res.low).toBe(60.0);
      expect(res.high).toBeNull();
      expect(res.isLowerBoundOnly).toBe(true);
    });

    it('should detect qualitative expected findings', () => {
      const res = parseReferenceRange('Negative');
      expect(res.isQualitative).toBe(true);
    });

    it('should handle empty or missing ranges', () => {
      const res = parseReferenceRange(null);
      expect(res.low).toBeNull();
      expect(res.high).toBeNull();
    });
  });

  describe('evaluateObservationAgainstRange', () => {
    it('should classify high values correctly', () => {
      const resHigh = evaluateObservationAgainstRange('115.0', '70.0 - 99.0');
      expect(resHigh.flag).toBe('HIGH');
      expect(resHigh.numericValue).toBe(115.0);

      const resCritHigh = evaluateObservationAgainstRange('142.0', '70.0 - 99.0');
      expect(resCritHigh.flag).toBe('CRITICAL_HIGH');
      expect(resCritHigh.numericValue).toBe(142.0);
    });

    it('should classify within-range normal values', () => {
      const res = evaluateObservationAgainstRange('0.95', '0.70 - 1.30');
      expect(res.flag).toBe('NORMAL');
      expect(res.numericValue).toBe(0.95);
    });

    it('should classify values exceeding upper threshold', () => {
      const res = evaluateObservationAgainstRange('228.0', '< 200.0');
      expect(res.flag).toBe('HIGH');
    });

    it('should classify values below lower threshold', () => {
      const res = evaluateObservationAgainstRange('35.0', '> 60.0');
      expect(res.flag).toBe('LOW');
    });

    it('should leave missing reference ranges unclassified', () => {
      const res = evaluateObservationAgainstRange('150.0', null);
      expect(res.flag).toBe('UNCLASSIFIED');
      expect(res.low).toBeNull();
      expect(res.high).toBeNull();
    });
  });
});
