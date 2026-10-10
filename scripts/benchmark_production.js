// Automated HTTP latency & correctness benchmark for LifeCare AI
const PROD_URL = 'https://lifecare-ai-xi.vercel.app';

async function measure(name, url) {
  const start = Date.now();
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Benchmark/1.0' } });
    const elapsed = Date.now() - start;
    const isJson = res.headers.get('content-type')?.includes('application/json');
    let data = null;
    if (isJson) {
      data = await res.json();
    } else {
      await res.text();
    }
    return { name, url, status: res.status, elapsed, ok: res.ok, count: data?.patients?.length || data?.records?.length || (data?.totalPatients ? 1 : null) };
  } catch (err) {
    return { name, url, status: 0, elapsed: Date.now() - start, ok: false, error: err.message };
  }
}

async function run() {
  console.log('========================================================================');
  console.log('LifeCare AI — Production HTTP Benchmark & Latency Validation');
  console.log('Target: ' + PROD_URL);
  console.log('========================================================================\n');

  const targets = [
    { name: 'GET /api/patients (Run 1)', url: `${PROD_URL}/api/patients` },
    { name: 'GET /api/patients (Run 2 - Cache Warm)', url: `${PROD_URL}/api/patients` },
    { name: 'GET /api/profile (Run 1)', url: `${PROD_URL}/api/profile` },
    { name: 'GET /api/profile (Run 2 - Cache Warm)', url: `${PROD_URL}/api/profile` },
    { name: 'GET /api/dashboard (Run 1)', url: `${PROD_URL}/api/dashboard` },
    { name: 'GET /api/dashboard (Run 2 - Cache Warm)', url: `${PROD_URL}/api/dashboard` },
    { name: 'GET /api/records', url: `${PROD_URL}/api/records` },
    { name: 'GET /patients (HTML Page)', url: `${PROD_URL}/patients` },
    { name: 'GET /profile (HTML Page)', url: `${PROD_URL}/profile` },
    { name: 'GET /dashboard (HTML Page)', url: `${PROD_URL}/dashboard` },
  ];

  for (const t of targets) {
    const res = await measure(t.name, t.url);
    const statusStr = res.ok ? `[PASS HTTP ${res.status}]` : `[FAIL HTTP ${res.status}]`;
    const speedStr = `${res.elapsed} ms`.padStart(9);
    console.log(`${statusStr} ${t.name.padEnd(35)} : ${speedStr}`);
  }
  console.log('\n========================================================================');
}

run();
