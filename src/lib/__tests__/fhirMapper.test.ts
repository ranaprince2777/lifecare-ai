import { describe, it, expect } from 'vitest';
import { mapToFHIRBundle } from '../fhir/fhirMapper';
import { DEMO_RECORDS, DEMO_PATIENT } from '../demo/fixtures';

describe('HL7 FHIR R4 Mapper', () => {
  it('should map a medical record and patient to a valid FHIR Bundle', () => {
    const record = DEMO_RECORDS[0]; // Lab Report
    const bundle = mapToFHIRBundle(record, DEMO_PATIENT);

    expect(bundle.resourceType).toBe('Bundle');
    expect(bundle.type).toBe('collection');
    expect(bundle.entry.length).toBeGreaterThan(0);

    // Verify Patient resource
    const patientEntry = bundle.entry.find((e) => (e.resource as { resourceType: string }).resourceType === 'Patient');
    expect(patientEntry).toBeDefined();
    const patientResource = patientEntry!.resource as {
      resourceType: string;
      name: Array<{ text: string }>;
      identifier?: Array<{ value: string }>;
    };
    expect(patientResource.name[0].text).toBe(DEMO_PATIENT.fullName);
    expect(patientResource.identifier?.[0].value).toBe(DEMO_PATIENT.mockAbhaId);

    // Verify Observation resources
    const observationEntries = bundle.entry.filter(
      (e) => (e.resource as { resourceType: string }).resourceType === 'Observation'
    );
    expect(observationEntries.length).toBe(record.observations.length);

    // Verify DiagnosticReport resource
    const reportEntry = bundle.entry.find(
      (e) => (e.resource as { resourceType: string }).resourceType === 'DiagnosticReport'
    );
    expect(reportEntry).toBeDefined();
    const reportResource = reportEntry!.resource as { resourceType: string; conclusion: string };
    expect(reportResource.conclusion).toBe(record.summary.summaryEn);
  });

  it('should map medication statements from a prescription', () => {
    const rxRecord = DEMO_RECORDS[1]; // Prescription
    const bundle = mapToFHIRBundle(rxRecord, DEMO_PATIENT);

    const medEntries = bundle.entry.filter(
      (e) => (e.resource as { resourceType: string }).resourceType === 'MedicationStatement'
    );
    expect(medEntries.length).toBe(rxRecord.medications.length);
  });
});
