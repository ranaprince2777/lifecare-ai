async function testSpeed() {
  console.log('Testing speed on local dev server http://localhost:3000...');

  // First call (uncached or cold cache)
  let t0 = Date.now();
  const r1 = await fetch('http://localhost:3000/api/patients');
  const d1 = await r1.json();
  const time1 = Date.now() - t0;
  console.log('Call 1: GET /api/patients took:', time1, 'ms | Status:', r1.status, '| Patients:', d1.patients?.length);

  // Second call (cache hit)
  t0 = Date.now();
  const r2 = await fetch('http://localhost:3000/api/patients');
  const d2 = await r2.json();
  const time2 = Date.now() - t0;
  console.log('Call 2: GET /api/patients (Cache Hit) took:', time2, 'ms | Status:', r2.status, '| Patients:', d2.patients?.length);

  // Profile call
  t0 = Date.now();
  const r3 = await fetch('http://localhost:3000/api/profile');
  const d3 = await r3.json();
  const time3 = Date.now() - t0;
  console.log('Call 3: GET /api/profile took:', time3, 'ms | Status:', r3.status, '| Profile:', d3.profile?.fullName);

  // Dashboard call
  t0 = Date.now();
  const r4 = await fetch('http://localhost:3000/api/dashboard');
  const d4 = await r4.json();
  const time4 = Date.now() - t0;
  console.log('Call 4: GET /api/dashboard took:', time4, 'ms | Status:', r4.status, '| Total Patients:', d4.stats?.totalPatients);
}

testSpeed().catch(console.error);
