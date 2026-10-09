import { ObservationFlag } from '../types/medical';

export interface ReferenceRangeEvaluation {
  flag: ObservationFlag;
  low: number | null;
  high: number | null;
  numericValue: number | null;
  explanation: string;
}

/**
 * Extracts a numeric value from string representations like "14.2 g/dL", "<0.05", "120", "98.6".
 */
export function parseNumericValue(valueStr: string | null | undefined): number | null {
  if (!valueStr) return null;
  const clean = valueStr.trim().replace(/,/g, '');
  // Match standard float or integer
  const match = clean.match(/^([<>]?=?\s*)?([+-]?\d+(?:\.\d+)?)/);
  if (!match) return null;
  const num = parseFloat(match[2]);
  return isNaN(num) ? null : num;
}

/**
 * Parses raw reference range string supplied by source document into numeric boundaries.
 * Examples handled:
 * - "13.5 - 17.5"
 * - "70.0 - 99.0 mg/dL"
 * - "< 200" / "<= 200"
 * - "> 60" / ">= 60"
 * - "0.5 - 1.2"
 * - "Negative" / "Normal" (Qualitative)
 */
export function parseReferenceRange(rangeStr: string | null | undefined): {
  low: number | null;
  high: number | null;
  isUpperBoundOnly: boolean;
  isLowerBoundOnly: boolean;
  isQualitative: boolean;
} {
  const result = {
    low: null as number | null,
    high: null as number | null,
    isUpperBoundOnly: false,
    isLowerBoundOnly: false,
    isQualitative: false,
  };

  if (!rangeStr || rangeStr.trim() === '' || rangeStr.trim() === '-' || /not\s+established|n\/a|variable/i.test(rangeStr)) {
    return result;
  }

  const str = rangeStr.trim();

  // Qualitative checks
  if (/^(negative|non-reactive|normal|nil|absent)$/i.test(str)) {
    result.isQualitative = true;
    return result;
  }

  // Upper bound inequality: < 200, <= 140, Less than 200, Up to 150
  const upperMatch = str.match(/(?:<|<=|less\s+than|up\s+to)\s*([+-]?\d+(?:\.\d+)?)/i);
  if (upperMatch) {
    const val = parseFloat(upperMatch[1]);
    if (!isNaN(val)) {
      result.high = val;
      result.isUpperBoundOnly = true;
      return result;
    }
  }

  // Lower bound inequality: > 60, >= 90, Greater than 60
  const lowerMatch = str.match(/(?:>|>=|greater\s+than)\s*([+-]?\d+(?:\.\d+)?)/i);
  if (lowerMatch) {
    const val = parseFloat(lowerMatch[1]);
    if (!isNaN(val)) {
      result.low = val;
      result.isLowerBoundOnly = true;
      return result;
    }
  }

  // Range pattern: "13.5 - 17.5", "13.5 to 17.5", "13.5 – 17.5"
  const rangeMatch = str.match(/([+-]?\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*([+-]?\d+(?:\.\d+)?)/i);
  if (rangeMatch) {
    const lowVal = parseFloat(rangeMatch[1]);
    const highVal = parseFloat(rangeMatch[2]);
    if (!isNaN(lowVal) && !isNaN(highVal)) {
      result.low = lowVal;
      result.high = highVal;
      return result;
    }
  }

  return result;
}

/**
 * Deterministically evaluates an extracted observation value against its source reference range.
 * Never invents a missing reference range.
 */
export function evaluateObservationAgainstRange(
  rawResult: string,
  rawRange: string | null | undefined
): ReferenceRangeEvaluation {
  const numericVal = parseNumericValue(rawResult);
  const parsedRange = parseReferenceRange(rawRange);

  // If no reference range was supplied by the source report:
  if (!rawRange || (!parsedRange.low && !parsedRange.high && !parsedRange.isQualitative)) {
    return {
      flag: 'UNCLASSIFIED',
      low: null,
      high: null,
      numericValue: numericVal,
      explanation: 'No reference range provided in source report to classify.',
    };
  }

  // If result is qualitative (e.g. Negative, Positive)
  if (parsedRange.isQualitative) {
    const isNormal = /negative|non-reactive|normal|nil|absent/i.test(rawResult.trim());
    return {
      flag: isNormal ? 'NORMAL' : 'HIGH',
      low: null,
      high: null,
      numericValue: numericVal,
      explanation: isNormal
        ? 'Result matches expected qualitative normal finding.'
        : 'Result differs from expected normal qualitative finding.',
    };
  }

  // If numeric parsing failed for the test result:
  if (numericVal === null) {
    return {
      flag: 'UNCLASSIFIED',
      low: parsedRange.low,
      high: parsedRange.high,
      numericValue: null,
      explanation: 'Result value could not be reliably parsed as a numeric comparison.',
    };
  }

  const { low, high, isUpperBoundOnly, isLowerBoundOnly } = parsedRange;

  // Upper bound only check (e.g., < 200 mg/dL)
  if (isUpperBoundOnly && high !== null) {
    if (numericVal > high) {
      const isCritical = numericVal >= high * 1.5;
      return {
        flag: isCritical ? 'CRITICAL_HIGH' : 'HIGH',
        low: null,
        high,
        numericValue: numericVal,
        explanation: `Result (${numericVal}) exceeds source upper threshold (< ${high}).`,
      };
    }
    return {
      flag: 'NORMAL',
      low: null,
      high,
      numericValue: numericVal,
      explanation: `Result (${numericVal}) is within source limit (< ${high}).`,
    };
  }

  // Lower bound only check (e.g., > 60 mL/min)
  if (isLowerBoundOnly && low !== null) {
    if (numericVal < low) {
      const isCritical = numericVal <= low * 0.5;
      return {
        flag: isCritical ? 'CRITICAL_LOW' : 'LOW',
        low,
        high: null,
        numericValue: numericVal,
        explanation: `Result (${numericVal}) is below source lower threshold (> ${low}).`,
      };
    }
    return {
      flag: 'NORMAL',
      low,
      high: null,
      numericValue: numericVal,
      explanation: `Result (${numericVal}) meets source minimum threshold (> ${low}).`,
    };
  }

  // Standard Low - High interval
  if (low !== null && high !== null) {
    if (numericVal < low) {
      const isCritical = low > 0 && numericVal <= low * 0.7;
      return {
        flag: isCritical ? 'CRITICAL_LOW' : 'LOW',
        low,
        high,
        numericValue: numericVal,
        explanation: `Result (${numericVal}) is below source reference range (${low} - ${high}).`,
      };
    }
    if (numericVal > high) {
      const isCritical = high > 0 && numericVal >= high * 1.35;
      return {
        flag: isCritical ? 'CRITICAL_HIGH' : 'HIGH',
        low,
        high,
        numericValue: numericVal,
        explanation: `Result (${numericVal}) is above source reference range (${low} - ${high}).`,
      };
    }
    return {
      flag: 'NORMAL',
      low,
      high,
      numericValue: numericVal,
      explanation: `Result (${numericVal}) falls within source reference range (${low} - ${high}).`,
    };
  }

  return {
    flag: 'UNCLASSIFIED',
    low: null,
    high: null,
    numericValue: numericVal,
    explanation: 'Reference range format could not be deterministically evaluated.',
  };
}
