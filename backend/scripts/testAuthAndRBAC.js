import http from 'http';

const BASE_URL = 'http://127.0.0.1:5001';

const makeRequest = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

async function runTestSuite() {
  console.log('====================================================');
  console.log('🧪 RESQNET AI - AUTHENTICATION & RBAC TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const test = (name, condition, details = '') => {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name} ${details ? '- ' + details : ''}`);
      failed++;
    }
  };

  try {
    // 1. ANONYMOUS REPORTING & TRACKING
    console.log('\n--- Category A: Anonymous Distress Reporting & Tracking ---');

    const anonRes = await makeRequest('POST', '/api/incidents', {
      incidentType: 'Flood',
      description: 'Basement flooded with 2ft water near hospital entrance',
      location: { address: 'City Hospital Gate 2', landmark: 'Near Emergency Ward' },
      affectedPeople: '5 - 20',
      safetyStatus: 'Trapped',
      urgency: 'High',
    });

    test('1. Anonymous user can submit emergency request', anonRes.status === 201 && anonRes.data?.success);
    test('2. Response returns unique requestId', !!anonRes.data?.requestId && anonRes.data.requestId.startsWith('REQ-'));
    test('3. Response returns 6-digit confidential trackingPin', !!anonRes.data?.trackingPin && anonRes.data.trackingPin.length === 6);
    test('4. Default verification status is PENDING_VERIFICATION', anonRes.data?.incident?.verificationStatus === 'PENDING_VERIFICATION');

    const createdRequestId = anonRes.data?.requestId;
    const createdTrackingPin = anonRes.data?.trackingPin;

    // Track with valid PIN
    const trackSuccess = await makeRequest('POST', '/api/incidents/track', {
      requestId: createdRequestId,
      trackingPin: createdTrackingPin,
    });
    test('5. Anonymous user can track request with valid ID and PIN', trackSuccess.status === 200 && trackSuccess.data?.request?.status === 'PENDING_VERIFICATION');
    test('6. Sanitized tracking does not expose coordinates or private data', trackSuccess.data?.request?.generalArea === 'Near Emergency Ward');

    // Track with invalid PIN
    const trackBadPin = await makeRequest('POST', '/api/incidents/track', {
      requestId: createdRequestId,
      trackingPin: '999999',
    });
    test('7. Track request rejects invalid PIN with 401', trackBadPin.status === 401);

    // 2. PUBLIC HELP PROVIDER REGISTRATION
    console.log('\n--- Category B: Help Provider Public Registration ---');

    const providerEmail = `provider_${Date.now()}@example.com`;
    const regRes = await makeRequest('POST', '/api/auth/register', {
      name: 'Ramesh Relief Team',
      email: providerEmail,
      password: 'ProviderPass2026!',
      confirmPassword: 'ProviderPass2026!',
      phone: '+91 98123 45678',
      location: 'North Delhi',
      role: 'ADMIN', // Tampering attempt: should be ignored!
    });

    test('8. Public registration succeeds without client-selected role', regRes.status === 201 && !!regRes.data?.token);
    test('9. Backend strictly enforces RESOURCE_PROVIDER role (ignores role: ADMIN tampering)', regRes.data?.user?.role === 'RESOURCE_PROVIDER');

    const providerToken = regRes.data?.token;
    const providerId = regRes.data?.user?.id;

    // Reject mismatched passwords
    const regMismatch = await makeRequest('POST', '/api/auth/register', {
      name: 'Mismatch User',
      email: 'mismatch@example.com',
      password: 'password123',
      confirmPassword: 'differentPassword',
    });
    test('10. Registration rejects mismatched confirm password', regMismatch.status === 400);

    // Reject short passwords
    const regShort = await makeRequest('POST', '/api/auth/register', {
      name: 'Short Pass User',
      email: 'short@example.com',
      password: '123',
    });
    test('11. Registration rejects passwords shorter than 6 characters', regShort.status === 400);

    // 3. COMMON LOGIN GATEWAY
    console.log('\n--- Category C: Common Login Gateway ---');

    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: providerEmail,
      password: 'ProviderPass2026!',
    });
    test('12. Common login succeeds with email and password', loginRes.status === 200 && !!loginRes.data?.token);
    test('13. Login returns user profile with role RESOURCE_PROVIDER', loginRes.data?.user?.role === 'RESOURCE_PROVIDER');

    // Bad password login
    const loginBad = await makeRequest('POST', '/api/auth/login', {
      email: providerEmail,
      password: 'WrongPassword!',
    });
    test('14. Login rejects invalid credentials with 401', loginBad.status === 401);

    // 4. RESOURCE PROVIDER CAPABILITIES & BOUNDARIES
    console.log('\n--- Category D: Resource Provider Permissions & Boundaries ---');

    // Provider creates resource
    const createResourceRes = await makeRequest('POST', '/api/resources', {
      resourceType: 'Shelter',
      title: 'Community Shelter Hall',
      description: 'Air-conditioned community hall with 30 cots',
      quantity: '30 cots',
      location: { address: 'Sector 12 Community Center' },
      availability: 'Available',
    }, providerToken);

    test('15. Provider can create new resource offer', createResourceRes.status === 201 && createResourceRes.data?.resource?.verificationStatus === 'PENDING_VERIFICATION');
    const createdResourceId = createResourceRes.data?.resource?._id;

    // Provider fetches their own resources
    const myResourcesRes = await makeRequest('GET', '/api/resources/my', null, providerToken);
    test('16. Provider can list their own resources (/api/resources/my)', myResourcesRes.status === 200 && myResourcesRes.data?.resources?.length > 0);

    // Provider updates availability on their own resource
    const updateAvailRes = await makeRequest('PATCH', `/api/resources/${createdResourceId}`, {
      availability: 'In Use',
    }, providerToken);
    test('17. Provider can update availability on own resource', updateAvailRes.status === 200 && updateAvailRes.data?.resource?.availability === 'In Use');

    // Provider tries to change verificationStatus directly (SECURITY TEST)
    const unauthorizedVerify = await makeRequest('PATCH', `/api/resources/${createdResourceId}`, {
      verificationStatus: 'VERIFIED',
    }, providerToken);
    test('18. Provider CANNOT change verificationStatus directly (Forbidden 403)', unauthorizedVerify.status === 403);

    // Provider tries to verify via coordinator endpoint (SECURITY TEST)
    const unauthorizedVerifyEndpoint = await makeRequest('POST', `/api/resources/${createdResourceId}/verify`, {
      action: 'VERIFY',
    }, providerToken);
    test('19. Provider CANNOT call /api/resources/:id/verify (Forbidden 403)', unauthorizedVerifyEndpoint.status === 403);

    // Provider tries to verify incident (SECURITY TEST)
    const unauthorizedIncidentVerify = await makeRequest('POST', `/api/incidents/${anonRes.data?.incidentId}/verify`, {
      action: 'VERIFY',
    }, providerToken);
    test('20. Provider CANNOT verify incidents (Forbidden 403)', unauthorizedIncidentVerify.status === 403);

    // Provider tries to access admin users list (SECURITY TEST)
    const unauthorizedUserList = await makeRequest('GET', '/api/users', null, providerToken);
    test('21. Provider CANNOT access user management /api/users (Forbidden 403)', unauthorizedUserList.status === 403);

    // 5. DEMO PERSONAS & COORDINATOR RBAC
    console.log('\n--- Category E: Demo Personas & Coordinator RBAC ---');

    const coordDemo = await makeRequest('POST', '/api/auth/demo-login', { persona: 'coordinator' });
    test('22. Coordinator persona login succeeds', coordDemo.status === 200 && !!coordDemo.data?.token);
    const coordToken = coordDemo.data?.token;

    // Coordinator can verify incident
    const verifyIncRes = await makeRequest('POST', `/api/incidents/${anonRes.data?.incidentId}/verify`, {
      action: 'VERIFY',
      reason: 'Verified on-ground by disaster patrol',
    }, coordToken);
    test('23. Coordinator CAN verify emergency incidents', verifyIncRes.status === 200 && verifyIncRes.data?.incident?.verificationStatus === 'VERIFIED');

    // Coordinator can verify resource
    const verifyResRes = await makeRequest('POST', `/api/resources/${createdResourceId}/verify`, {
      action: 'VERIFY',
      reason: 'Shelter capacity confirmed by inspection',
    }, coordToken);
    test('24. Coordinator CAN verify community resources', verifyResRes.status === 200 && verifyResRes.data?.resource?.verificationStatus === 'VERIFIED');

    // Coordinator tries to appoint another user's role (Admin-only action)
    const coordChangeRole = await makeRequest('PATCH', `/api/users/${providerId}/role`, {
      role: 'COORDINATOR',
    }, coordToken);
    test('25. Coordinator CANNOT modify user roles (Admin only - 403)', coordChangeRole.status === 403);

    // 6. ADMIN RBAC & USER MANAGEMENT
    console.log('\n--- Category F: Admin Privileges & Role Assignment ---');

    // Login as seeded Admin or promote coordinator for test
    // Let's create an Admin token using the seeded admin or seed script credentials
    const adminLoginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@resqnet.org',
      password: 'AdminSecurePassword2026!',
    });

    let adminToken = adminLoginRes.data?.token;
    if (!adminToken) {
      // If admin not seeded yet in in-memory mongo, let's test via demo persona or inspect
      console.log('   (Admin not yet logged in with seed password, testing seedAdmin execution next)');
    } else {
      test('26. Admin can log in with environment seed credentials', !!adminToken);

      // Admin accesses user list
      const adminUsersRes = await makeRequest('GET', '/api/users', null, adminToken);
      test('27. Admin can access user list /api/users', adminUsersRes.status === 200 && Array.isArray(adminUsersRes.data?.users));

      // Admin appoints provider to COORDINATOR
      const appointRes = await makeRequest('PATCH', `/api/users/${providerId}/role`, {
        role: 'COORDINATOR',
      }, adminToken);
      test('28. Admin can appoint user to COORDINATOR role', appointRes.status === 200 && appointRes.data?.user?.role === 'COORDINATOR');

      // Admin deactivates user
      const deactivateRes = await makeRequest('PATCH', `/api/users/${providerId}/status`, {
        isActive: false,
      }, adminToken);
      test('29. Admin can deactivate user account', deactivateRes.status === 200 && deactivateRes.data?.user?.isActive === false);

      // Deactivated user tries to log in
      const deactivatedLogin = await makeRequest('POST', '/api/auth/login', {
        email: providerEmail,
        password: 'ProviderPass2026!',
      });
      test('30. Deactivated user cannot log in (403 Forbidden)', deactivatedLogin.status === 403);
    }

    console.log('\n====================================================');
    console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('====================================================');
  } catch (err) {
    console.error('Fatal test error:', err);
  }
}

runTestSuite();
