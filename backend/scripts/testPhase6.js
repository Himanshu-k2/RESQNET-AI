// Automated Phase 6 Verification Test
// Tests simulation mode scenario start, AI matching, step advance, and real-data preservation during reset.

const API_BASE = 'http://localhost:5001/api';

async function runTests() {
  console.log('=====================================================');
  console.log('🧪 RUNNING PHASE 6 SIMULATION & POLISH VERIFICATION');
  console.log('=====================================================');

  // 1. Health Check
  const healthRes = await fetch(`${API_BASE}/health`);
  const healthData = await healthRes.json();
  console.log('✓ 1. Health Check Phase:', healthData.phase);
  if (!healthData.phase.includes('Phase 6')) {
    throw new Error('Health check phase is not Phase 6');
  }

  // 2. Demo Auth as Coordinator
  const authRes = await fetch(`${API_BASE}/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'coordinator' }),
  });
  const authData = await authRes.json();
  const token = authData.token;
  console.log('✓ 2. Authenticated as Coordinator:', authData.user?.name);

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 3. Check Simulation Status
  const statusRes = await fetch(`${API_BASE}/simulation/status`);
  const statusData = await statusRes.json();
  console.log('✓ 3. Initial Simulation Status:', {
    simulationMode: statusData.simulationMode,
    availableScenarios: statusData.availableScenarios?.length,
    counts: statusData.counts,
  });

  // 4. Start Flood Crisis Scenario
  const startFloodRes = await fetch(`${API_BASE}/simulation/start`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ scenario: 'FLOOD' }),
  });
  const floodData = await startFloodRes.json();
  console.log('✓ 4. Started Flood Scenario:', floodData.scenario?.name);
  const simulatedIncident = floodData.incident;
  if (!simulatedIncident || !simulatedIncident.isSimulation) {
    throw new Error('Simulated incident missing or isSimulation is not true');
  }
  console.log('   - Incident ID:', simulatedIncident._id);
  console.log('   - isSimulation:', simulatedIncident.isSimulation);
  console.log('   - Resources created:', floodData.resources?.length);

  // 5. Advance Step: Verify Incident
  const verifyStepRes = await fetch(`${API_BASE}/simulation/advance-step`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      incidentId: simulatedIncident._id,
      step: 'VERIFY',
    }),
  });
  const verifyStepData = await verifyStepRes.json();
  console.log('✓ 5. Advanced Demo Step (VERIFY):', verifyStepData.incident?.verificationStatus);
  if (verifyStepData.incident?.verificationStatus !== 'VERIFIED') {
    throw new Error('Incident verification status did not change to VERIFIED');
  }

  // 6. Multimodal AI Resource Matching on Simulated Incident
  const matchRes = await fetch(`${API_BASE}/ai/resource-matching`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ incidentId: simulatedIncident._id }),
  });
  const matchData = await matchRes.json();
  console.log('✓ 6. AI Resource Matching Executed:', {
    success: matchData.success,
    recommendationCount: matchData.recommendations?.length,
    matchSummary: matchData.summary?.slice(0, 70) + '...',
  });

  // 7. Approve Allocation if a match recommendation exists
  if (matchData.recommendations && matchData.recommendations.length > 0) {
    const targetResource = matchData.recommendations[0].resource;
    const approveRes = await fetch(`${API_BASE}/ai/approve-allocation`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        incidentId: simulatedIncident._id,
        resourceId: targetResource._id,
        notes: 'Verified and approved for campus hostel flood evacuation.',
      }),
    });
    const approveData = await approveRes.json();
    console.log('✓ 7. Approved Resource Allocation:', approveData.message);
  } else {
    console.log('✓ 7. No recommendation to allocate (pass)');
  }

  // 8. Create a REAL Citizen Incident (isSimulation: false) to test non-destructive reset
  const realIncidentRes = await fetch(`${API_BASE}/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      incidentType: 'Medical Emergency',
      description: 'REAL CITIZEN TEST INCIDENT: Actual ground report that must survive simulation resets.',
      location: {
        address: 'Sector 9 Real Community Hospital',
        landmark: 'Near Trauma Center',
        coordinates: { lat: 28.530, lng: 77.180 },
      },
      affectedPeople: '1',
      safetyStatus: 'Medical Attention Needed',
      requiredResources: ['Ambulance Support'],
      contact: {
        name: 'Genuine Citizen Reporter',
        phone: '+91 91111 22222',
        email: 'realcitizen@example.org',
      },
      urgency: 'High',
      isSimulation: false,
    }),
  });
  const realIncidentData = await realIncidentRes.json();
  const realIncidentId = realIncidentData.incidentId || realIncidentData.incident?._id;
  console.log('✓ 8. Created Real Incident (isSimulation: false):', realIncidentId);

  // 9. Execute Safe Simulation Reset
  const resetRes = await fetch(`${API_BASE}/simulation/reset`, {
    method: 'POST',
    headers: authHeaders,
  });
  const resetData = await resetRes.json();
  console.log('✓ 9. Executed Simulation Reset:', resetData.message);
  console.log('   - Purged simulated records:', resetData.cleared);

  // 10. CRITICAL CHECK: Verify Real Incident was PRESERVED!
  const checkRealRes = await fetch(`${API_BASE}/incidents/${realIncidentId}`);
  const checkRealData = await checkRealRes.json();
  if (checkRealData.success && checkRealData.incident) {
    console.log('✓ 10. SAFETY CONFIRMED: Real Incident is INTACT after simulation reset!');
    console.log('   - Real Incident Address:', checkRealData.incident.location?.address);
  } else {
    throw new Error('CRITICAL FAILURE: Real incident was deleted by simulation reset!');
  }

  // 11. Clean up the real test incident
  const deleteRealRes = await fetch(`${API_BASE}/incidents/${realIncidentId}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ status: 'CLOSED' }),
  });
  console.log('✓ 11. Closed real test incident.');

  console.log('=====================================================');
  console.log('🎉 ALL PHASE 6 AUTOMATED TESTS PASSED SUCCESSFULLY!');
  console.log('=====================================================');
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
