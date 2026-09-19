import http from 'http';

const BASE_URL = 'http://127.0.0.1:5001';

async function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, data: json });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 TESTING CRITICAL SCENARIOS & AI ANALYSIS APIS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Check GET /api/simulation/status
  const statusRes = await request(`${BASE_URL}/api/simulation/status`);
  assert(statusRes.status === 200, 'GET /api/simulation/status returns 200 OK');
  assert(Array.isArray(statusRes.data?.availableScenarios), 'availableScenarios is an array');
  assert(statusRes.data?.availableScenarios?.length >= 6, 'Contains all 6 preparedness scenarios');
  
  const categories = statusRes.data?.availableScenarios?.map(s => s.category);
  assert(categories.includes('Flood') && categories.includes('Fire') && categories.includes('Earthquake') && categories.includes('Extreme Weather'), 'Contains Flood, Fire, Earthquake, Extreme Weather scenarios');

  // 2. Authenticate as Coordinator to test protected detail and AI endpoints
  const loginRes = await request(`${BASE_URL}/api/auth/demo-login`, {
    method: 'POST',
    body: { role: 'coordinator' },
  });
  const token = loginRes.data?.token;
  assert(Boolean(token), 'Obtained auth token for Coordinator');

  // 3. Test GET /api/simulation/scenarios/FLOOD
  const scenarioDetailRes = await request(`${BASE_URL}/api/simulation/scenarios/FLOOD`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(scenarioDetailRes.status === 200, 'GET /api/simulation/scenarios/FLOOD returns 200 OK');
  assert(scenarioDetailRes.data?.scenario?.name?.includes('Flood'), 'Scenario detail includes title');
  assert(Array.isArray(scenarioDetailRes.data?.scenario?.resourceAnalysis), 'resourceAnalysis is an array');
  assert(Boolean(scenarioDetailRes.data?.scenario?.disclaimer), 'Disclaimer is included in response');

  // 4. Test POST /api/ai/scenario-analysis
  const aiAnalysisRes = await request(`${BASE_URL}/api/ai/scenario-analysis`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: { scenarioId: 'FLOOD' },
  });
  assert(aiAnalysisRes.status === 200, 'POST /api/ai/scenario-analysis returns 200 OK');
  assert(Boolean(aiAnalysisRes.data?.analysis?.summary), 'AI analysis includes operational summary');
  assert(Array.isArray(aiAnalysisRes.data?.analysis?.simulatedGaps), 'AI analysis includes simulatedGaps array');
  assert(Array.isArray(aiAnalysisRes.data?.analysis?.coordinationChecklist), 'AI analysis includes coordinationChecklist array');
  assert(Boolean(aiAnalysisRes.data?.analysis?.disclaimer), 'AI analysis includes disclaimer');

  // 5. Test Public / Unauthenticated rejection on /api/simulation/scenarios/:id
  const unauthDetailRes = await request(`${BASE_URL}/api/simulation/scenarios/FLOOD`);
  assert(unauthDetailRes.status === 401, 'Unauthenticated request to /api/simulation/scenarios/FLOOD is rejected with 401');

  console.log('\n====================================================');
  console.log(`📊 CRITICAL SCENARIOS RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');
}

runTests().catch(console.error);
