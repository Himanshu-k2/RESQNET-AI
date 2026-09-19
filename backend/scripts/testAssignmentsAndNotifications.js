import http from 'http';

const BASE_URL = 'http://127.0.0.1:5001';

function request(url, options = {}) {
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
  console.log('🧪 TESTING ASSIGNMENTS & NOTIFICATION SYSTEM');
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

  // 1. Authenticate Admin
  const adminLogin = await request(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: { email: 'admin@resqnet.org', password: 'AdminSecurePassword2026!' },
  });
  const adminToken = adminLogin.data?.token;
  assert(Boolean(adminToken), '1. Admin logged in successfully');

  // 2. Register & Login a Help Provider
  const uniqueNum = Date.now();
  const providerEmail = `provider_${uniqueNum}@community.org`;
  const regRes = await request(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    body: {
      name: 'South Bay Mutual Aid',
      email: providerEmail,
      password: 'ProviderPassword123!',
      confirmPassword: 'ProviderPassword123!',
      phone: '+91 98765 43210',
      organization: 'South Bay NGO',
    },
  });
  const providerToken = regRes.data?.token;
  const providerId = regRes.data?.user?._id;
  assert(Boolean(providerToken), '2. Help Provider registered successfully');

  // 3. Provider submits a relief resource
  const resOfferRes = await request(`${BASE_URL}/api/resources`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${providerToken}` },
    body: {
      resourceType: 'Water',
      title: '50 Clean Water Cans (20L)',
      description: 'Potable water containers sealed for emergency delivery.',
      quantity: '50',
      unit: 'Bottles / Cans',
      location: { address: 'Warehouse Bay 4, Harbor Road' },
      availability: 'Available',
      contact: { name: 'Dispatch Desk', phone: '+91 98765 43210' },
    },
  });
  const resourceId = resOfferRes.data?.resource?._id;
  assert(Boolean(resourceId), '3. Provider created resource offer');
  assert(resOfferRes.data?.resource?.verificationStatus === 'PENDING_VERIFICATION', '4. Newly submitted resource defaults to PENDING_VERIFICATION');

  // 4. Anonymous user submits emergency incident
  const incRes = await request(`${BASE_URL}/api/incidents`, {
    method: 'POST',
    body: {
      incidentType: 'Flood',
      description: 'Ground floor clinic flooded with 3ft contaminated water.',
      location: { address: 'Greenfield Primary Health Center' },
      affectedPeople: '15 patients',
      safetyStatus: 'Trapped',
      requiredResources: ['Drinking Water', 'Evacuation Transport'],
      urgency: 'Critical',
    },
  });
  const incidentId = incRes.data?.incident?._id;
  const requestId = incRes.data?.incident?.requestId;
  assert(Boolean(incidentId), '5. Emergency incident submitted anonymously');

  // 5. Admin attempts to assign UNVERIFIED resource -> must reject
  const invalidAssignRes = await request(`${BASE_URL}/api/assignments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { incidentId, resourceId },
  });
  assert(invalidAssignRes.status === 400, '6. Assignment rejects unverified resource with 400');

  // 6. Admin verifies the resource & incident
  const verifyRes = await request(`${BASE_URL}/api/resources/${resourceId}/verify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { action: 'VERIFY', reason: 'Field coordinator checked stock on site.' },
  });
  assert(verifyRes.status === 200 && verifyRes.data?.resource?.verificationStatus === 'VERIFIED', '7. Admin verified the community resource');

  const verifyInc = await request(`${BASE_URL}/api/incidents/${incidentId}/verify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { action: 'VERIFY', reason: 'Cross-checked with regional dispatch.' },
  });
  assert(verifyInc.status === 200 && verifyInc.data?.incident?.verificationStatus === 'VERIFIED', '8. Admin verified the emergency request');

  // 7. Admin assigns the verified resource to the verified incident
  const assignRes = await request(`${BASE_URL}/api/assignments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { incidentId, resourceId, notes: 'Deploy immediately via Harbor Road route.' },
  });
  assert(assignRes.status === 201, '9. Admin successfully created resource assignment (201 Created)');
  assert(assignRes.data?.incident?.status === 'ASSIGNED', '10. Incident status transitioned to ASSIGNED');
  assert(assignRes.data?.resource?.availability === 'Allocated', '11. Resource availability transitioned to Allocated');
  const assignmentId = assignRes.data?.assignment?._id;

  // 8. Provider checks notifications
  const notifRes = await request(`${BASE_URL}/api/notifications`, {
    headers: { Authorization: `Bearer ${providerToken}` },
  });
  assert(notifRes.status === 200, '12. Provider retrieved notifications');
  assert(notifRes.data?.unreadCount >= 1, '13. Provider has at least 1 unread notification');
  const providerNotif = notifRes.data?.notifications?.[0];
  assert(providerNotif?.type === 'RESOURCE_ASSIGNED', '14. Notification type is RESOURCE_ASSIGNED');
  assert(providerNotif?.title === 'Resource Assignment Received', '15. Notification title matches requirements');

  // 9. Mark notification as read
  const markReadRes = await request(`${BASE_URL}/api/notifications/${providerNotif._id}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${providerToken}` },
  });
  assert(markReadRes.status === 200 && markReadRes.data?.notification?.isRead === true, '16. Provider marked notification as read');

  // 10. Privacy Isolation check: Another user cannot read or mark this notification
  const anotherLogin = await request(`${BASE_URL}/api/auth/demo-login`, {
    method: 'POST',
    body: { role: 'citizen' },
  });
  const citizenToken = anotherLogin.data?.token;
  const illegalReadRes = await request(`${BASE_URL}/api/notifications/${providerNotif._id}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${citizenToken}` },
  });
  assert(illegalReadRes.status === 404, '17. Unauthorized user cannot access/modify another user\'s notification (404)');

  // 11. Provider accepts assignment
  const acceptRes = await request(`${BASE_URL}/api/assignments/${assignmentId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${providerToken}` },
    body: { status: 'ACCEPTED', notes: 'Truck loaded and en route to clinic.' },
  });
  assert(acceptRes.status === 200 && acceptRes.data?.assignment?.status === 'ACCEPTED', '18. Provider accepted assignment (ACCEPTED)');

  console.log('\n====================================================');
  console.log(`📊 ASSIGNMENT & NOTIFICATION RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');
}

runTests().catch(console.error);
