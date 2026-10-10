import fs from 'fs';
import path from 'path';

async function runPatientDocumentIntegrationAudit() {
  console.log('========================================================================');
  console.log('LifeCare AI — Patient-Centered Document-Driven Integration Verification');
  console.log('========================================================================\n');

  const BASE_URL = 'http://localhost:3000';
  let passedCount = 0;
  let totalCount = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalCount++;
    if (condition) {
      passedCount++;
      console.log(`✅ [PASS] ${testName}`);
      if (detail) console.log(`   └─ ${detail}`);
    } else {
      console.log(`❌ [FAIL] ${testName}`);
      if (detail) console.log(`   └─ ${detail}`);
    }
  }

  // 1. Patient Directory Retrieval
  let testPatientId = '';
  try {
    const res = await fetch(`${BASE_URL}/api/patients`);
    const data = await res.json();
    assert(
      res.ok && data.success && Array.isArray(data.patients) && data.patients.length >= 3,
      '1. Patient Registry Directory API',
      `Found ${data.patients?.length} registered patients in system`
    );

    // Look for Dr. Arjun Mehta or create him
    let arjun = data.patients.find((p: { fullName: string }) => p.fullName.includes('Arjun Mehta'));
    if (!arjun) {
      const createRes = await fetch(`${BASE_URL}/api/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Dr. Arjun Mehta (Test)',
          age: 39,
          gender: 'Male',
          bloodGroup: 'O+',
          mockAbhaId: '91-3344-5566-7788',
          chronicConditions: ['Mild Asthmatic Bronchitis'],
          allergies: ['None'],
          isDemo: false,
        }),
      });
      const createdData = await createRes.json();
      arjun = createdData.patient;
    }
    testPatientId = arjun.id;
    assert(Boolean(testPatientId), '2. Verified Test Patient Available', `Patient ID: ${testPatientId} (${arjun.fullName})`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    assert(false, 'Patient Directory Retrieval', msg);
  }

  // 2. Prepare synthetic test document with unique content
  let testDocBuffer: Buffer;
  const uniqueTag = Date.now();
  const testFileName = `Arjun_Mehta_Cardiology_Panel_${uniqueTag}.pdf`;
  try {
    const samplePath = path.join(process.cwd(), 'public', 'sample_lab_report.pdf');
    const baseContent = fs.readFileSync(samplePath);
    const commentBuf = Buffer.from(`\n% Unique test run ID: ${uniqueTag} for Dr. Arjun Mehta\n`);
    testDocBuffer = Buffer.concat([baseContent, commentBuf]);
  } catch {
    testDocBuffer = Buffer.from(`%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n% Tag: ${uniqueTag}\n%%EOF`);
  }

  // 3. Upload & Associate Document with Test Patient
  let uploadedDocId = '';
  try {
    const blob = new Blob([new Uint8Array(testDocBuffer)], { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', blob, testFileName);
    formData.append('patientId', testPatientId);
    formData.append('generateHindi', 'true');

    const uploadRes = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });
    const uploadData = await uploadRes.json();

    assert(
      uploadRes.ok && uploadData.success && Boolean(uploadData.recordId),
      '3. Document Upload & Processing Pipeline',
      `Document processed as ${uploadData.record?.documentType || 'Lab Report'} (ID: ${uploadData.recordId})`
    );

    uploadedDocId = uploadData.recordId;

    assert(
      uploadData.record?.patientId === testPatientId,
      '4. Document-to-Patient Association',
      `Record patientId: "${uploadData.record?.patientId}" matches selected patient: "${testPatientId}"`
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    assert(false, 'Document Upload Pipeline', msg);
  }

  // 4. Duplicate Detection Verification
  try {
    const blob = new Blob([new Uint8Array(testDocBuffer)], { type: 'application/pdf' });
    const dupForm = new FormData();
    dupForm.append('file', blob, testFileName);
    dupForm.append('patientId', testPatientId);

    const dupRes = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: dupForm,
    });
    const dupData = await dupRes.json();

    assert(
      dupRes.status === 409 && dupData.isDuplicate === true,
      '5. Deterministic Duplicate Prevention',
      `Returned HTTP 409 Conflict with duplicate doc ID: ${dupData.existingRecordId}`
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    assert(false, 'Duplicate Detection Verification', msg);
  }

  // 5. Patient Detail Endpoint Data-Driven Population
  try {
    const patientDetailRes = await fetch(`${BASE_URL}/api/patients/${testPatientId}`);
    const detailData = await patientDetailRes.json();

    assert(
      patientDetailRes.ok && detailData.success && detailData.records?.length >= 1,
      '6. Patient Detail Command Center Endpoint',
      `Patient has ${detailData.records?.length} associated document(s) in registry`
    );

    const foundRecord = detailData.records?.find((r: { id: string }) => r.id === uploadedDocId);
    assert(
      Boolean(foundRecord),
      '7. Provenance Verification in Patient Record',
      `Found record "${foundRecord?.fileName}" with ${foundRecord?.observations?.length || 0} observations`
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    assert(false, 'Patient Detail Endpoint', msg);
  }

  // 6. Dynamic Dashboard Metrics Endpoint
  try {
    // A. Aggregate stats
    const aggRes = await fetch(`${BASE_URL}/api/dashboard`);
    const aggData = await aggRes.json();
    assert(
      aggRes.ok && aggData.success && aggData.stats?.isAggregate === true && aggData.stats?.totalPatients >= 3,
      '8. Dynamic Aggregate Dashboard Metrics',
      `Total Patients: ${aggData.stats?.totalPatients}, Total Docs: ${aggData.stats?.totalDocuments}, Observations: ${aggData.stats?.totalObservations}`
    );

    // B. Patient-specific stats
    const patRes = await fetch(`${BASE_URL}/api/dashboard?patientId=${testPatientId}`);
    const patData = await patRes.json();
    assert(
      patRes.ok && patData.success && patData.stats?.isAggregate === false && patData.stats?.totalDocuments >= 1,
      '9. Patient-Specific Dashboard Filtering',
      `Dr. Arjun Mehta stats: ${patData.stats?.totalDocuments} Docs, ${patData.stats?.totalObservations} Observations, ${patData.stats?.abnormalObservationsCount} Out-of-Range`
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    assert(false, 'Dashboard Metrics Verification', msg);
  }

  // 7. Patient Isolation in Medical Records Archive
  try {
    // Fetch specifically for test patient
    const arjunRecordsRes = await fetch(`${BASE_URL}/api/records?patientId=${testPatientId}`);
    const arjunData = await arjunRecordsRes.json();

    // Fetch specifically for Meera Nambiar
    const meeraRecordsRes = await fetch(`${BASE_URL}/api/records?patientId=pat-meera-nambiar`);
    const meeraData = await meeraRecordsRes.json();

    const arjunHasDoc = arjunData.records?.some((r: { id: string }) => r.id === uploadedDocId);
    const meeraHasDoc = meeraData.records?.some((r: { id: string }) => r.id === uploadedDocId);

    assert(
      arjunHasDoc && !meeraHasDoc,
      '10. Cross-Patient Isolation & Authorization',
      `Record is present in Dr. Arjun Mehta's archive and excluded from Meera Nambiar's archive`
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    assert(false, 'Patient Isolation Verification', msg);
  }

  console.log('\n========================================================================');
  console.log(`Final Result: ${passedCount}/${totalCount} Checks Passed (${Math.round((passedCount / totalCount) * 100)}%)`);
  console.log('========================================================================\n');
}

runPatientDocumentIntegrationAudit().catch((e) => console.error(e));
