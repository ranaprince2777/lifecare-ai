import { MedicalDocumentRecord, PatientProfile } from '../types/medical';

export interface FHIRBundle {
  resourceType: 'Bundle';
  id: string;
  type: 'collection';
  timestamp: string;
  entry: Array<{
    fullUrl: string;
    resource: Record<string, unknown>;
  }>;
  mappingNotes: {
    standard: 'HL7 FHIR R4';
    mappedResources: string[];
    unmappedFields: string[];
    limitations: string[];
  };
}

/**
 * Maps internal MediMind records and patient profile to an HL7 FHIR R4 compliant collection bundle.
 */
export function mapToFHIRBundle(
  record: MedicalDocumentRecord,
  patient?: PatientProfile
): FHIRBundle {
  const patientId = patient?.id || 'patient-default';
  const bundleId = `bundle-${record.id}`;
  const now = new Date().toISOString();

  const entries: FHIRBundle['entry'] = [];

  // 1. FHIR Patient Resource
  const patientResource: Record<string, unknown> = {
    resourceType: 'Patient',
    id: patientId,
    name: [
      {
        use: 'official',
        text: patient?.fullName || record.patientNameExtracted || 'Anonymous Patient',
      },
    ],
    gender: patient?.gender ? patient.gender.toLowerCase() : 'unknown',
  };

  if (patient?.mockAbhaId) {
    patientResource.identifier = [
      {
        system: 'https://healthid.ndhm.gov.in/demo',
        value: patient.mockAbhaId,
        type: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
              code: 'MR',
              display: 'Medical Record Number (Mock ABHA)',
            },
          ],
        },
      },
    ];
  }

  entries.push({
    fullUrl: `urn:uuid:${patientId}`,
    resource: patientResource,
  });

  // 2. FHIR Observations
  const observationRefs: Array<{ reference: string; display: string }> = [];

  record.observations.forEach((obs, index) => {
    const obsId = `obs-${record.id}-${index + 1}`;
    observationRefs.push({
      reference: `urn:uuid:${obsId}`,
      display: obs.testName,
    });

    const fhirInterpretation =
      obs.flag === 'HIGH' || obs.flag === 'CRITICAL_HIGH'
        ? { code: 'H', display: 'High' }
        : obs.flag === 'LOW' || obs.flag === 'CRITICAL_LOW'
        ? { code: 'L', display: 'Low' }
        : obs.flag === 'NORMAL'
        ? { code: 'N', display: 'Normal' }
        : undefined;

    const observationResource: Record<string, unknown> = {
      resourceType: 'Observation',
      id: obsId,
      status: 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'laboratory',
              display: 'Laboratory',
            },
          ],
        },
      ],
      code: {
        text: obs.testName,
      },
      subject: {
        reference: `urn:uuid:${patientId}`,
      },
      effectiveDateTime: record.documentDate || record.uploadedAt,
    };

    if (obs.testResultNumeric !== null && obs.testResultNumeric !== undefined) {
      observationResource.valueQuantity = {
        value: obs.testResultNumeric,
        unit: obs.unit || undefined,
      };
    } else {
      observationResource.valueString = obs.testResultValue;
    }

    if (obs.referenceRangeRaw || (obs.referenceRangeLow !== null && obs.referenceRangeHigh !== null)) {
      observationResource.referenceRange = [
        {
          text: obs.referenceRangeRaw || undefined,
          low: obs.referenceRangeLow !== null && obs.referenceRangeLow !== undefined ? { value: obs.referenceRangeLow, unit: obs.unit || undefined } : undefined,
          high: obs.referenceRangeHigh !== null && obs.referenceRangeHigh !== undefined ? { value: obs.referenceRangeHigh, unit: obs.unit || undefined } : undefined,
        },
      ];
    }

    if (fhirInterpretation) {
      observationResource.interpretation = [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
              code: fhirInterpretation.code,
              display: fhirInterpretation.display,
            },
          ],
        },
      ];
    }

    entries.push({
      fullUrl: `urn:uuid:${obsId}`,
      resource: observationResource,
    });
  });

  // 3. FHIR MedicationStatement
  record.medications.forEach((med, index) => {
    const medId = `med-${record.id}-${index + 1}`;
    const medResource: Record<string, unknown> = {
      resourceType: 'MedicationStatement',
      id: medId,
      status: med.isActive ? 'active' : 'completed',
      medicationCodeableConcept: {
        text: med.medicationName,
      },
      subject: {
        reference: `urn:uuid:${patientId}`,
      },
      effectiveDateTime: record.documentDate || record.uploadedAt,
      dosage: [
        {
          text: [med.dosage, med.frequency, med.instructions].filter(Boolean).join(', ') || undefined,
          route: med.route ? { text: med.route } : undefined,
        },
      ],
    };

    entries.push({
      fullUrl: `urn:uuid:${medId}`,
      resource: medResource,
    });
  });

  // 4. FHIR DiagnosticReport
  const reportResource: Record<string, unknown> = {
    resourceType: 'DiagnosticReport',
    id: `report-${record.id}`,
    status: 'final',
    code: {
      text: record.documentType,
    },
    subject: {
      reference: `urn:uuid:${patientId}`,
    },
    effectiveDateTime: record.documentDate || record.uploadedAt,
    issued: now,
    result: observationRefs,
    conclusion: record.summary.summaryEn,
  };

  entries.push({
    fullUrl: `urn:uuid:report-${record.id}`,
    resource: reportResource,
  });

  return {
    resourceType: 'Bundle',
    id: bundleId,
    type: 'collection',
    timestamp: now,
    entry: entries,
    mappingNotes: {
      standard: 'HL7 FHIR R4',
      mappedResources: ['Patient', 'Observation', 'MedicationStatement', 'DiagnosticReport'],
      unmappedFields: [
        'Document SHA-256 hash (stored in metadata, not standard FHIR resource field)',
        'Confidence score and review status (mapped to custom extensions in production)',
        'Hindi plain-language summary (stored in conclusion annotations)',
      ],
      limitations: [
        'Mock ABHA ID is for local hackathon demonstration only and is not linked to live ABDM gateway.',
        'LOINC and SNOMED-CT clinical coding systems are not mapped automatically without terminology server lookup.',
      ],
    },
  };
}
