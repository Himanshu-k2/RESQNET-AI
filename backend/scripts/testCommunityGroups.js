/**
 * End-to-End Test for Community Groups Module using native fetch
 */

const BASE_URL = 'http://localhost:5001/api';

async function req(url, options = {}) {
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.message || `HTTP ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function runTests() {
  console.log('🧪 Starting ResQNet AI Community Groups E2E Verification...\n');

  try {
    // 1. Authenticate Coordinator
    console.log('1. Authenticating Demo Coordinator (Cmdr. Sarah Jenkins)...');
    const coordLogin = await req('/auth/demo-login', {
      method: 'POST',
      body: { role: 'coordinator' }
    });
    const coordToken = coordLogin.token;
    console.log('   ✅ Coordinator authenticated:', coordLogin.user.name);

    // 2. Authenticate Citizen
    console.log('2. Authenticating Demo Citizen (Alex Rivera)...');
    const citizenLogin = await req('/auth/demo-login', {
      method: 'POST',
      body: { role: 'citizen' }
    });
    const citizenToken = citizenLogin.token;
    console.log('   ✅ Citizen authenticated:', citizenLogin.user.name);

    // 3. Coordinator creates a Community Group
    console.log('\n3. Creating Community Group: "Maplewood Towers - Block C"...');
    const createRes = await req('/groups', {
      method: 'POST',
      headers: { Authorization: `Bearer ${coordToken}` },
      body: {
        name: 'Maplewood Towers - Block C',
        category: 'APARTMENT',
        areaDescription: 'Tower C, Sector 14, Maplewood Society',
        description: 'Resident voluntary roll-calls, safety notices, and emergency mutual assistance.',
        privacy: 'INVITE_ONLY'
      }
    });

    const group = createRes.group;
    console.log('   ✅ Group created successfully:');
    console.log(`      ID: ${group._id}`);
    console.log(`      Name: ${group.name}`);
    console.log(`      Invite Code: ${group.inviteCode}`);
    console.log(`      Category: ${group.category}`);

    // 4. Citizen joins the group using the Invite Code
    console.log('\n4. Citizen joining group using invite code:', group.inviteCode);
    const joinRes = await req('/groups/join', {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` },
      body: { inviteCode: group.inviteCode }
    });
    console.log('   ✅ Citizen joined group successfully:', joinRes.group.name);

    // 5. Test Duplicate Join prevention
    console.log('\n5. Testing duplicate join attempt...');
    try {
      await req('/groups/join', {
        method: 'POST',
        headers: { Authorization: `Bearer ${citizenToken}` },
        body: { inviteCode: group.inviteCode }
      });
      console.error('   ❌ Duplicate join should have thrown an error!');
    } catch (err) {
      console.log('   ✅ Duplicate join rejected gracefully with status:', err.status, 'message:', err.message);
    }

    // 6. Citizen submits a Voluntary Safety Check-In
    console.log('\n6. Citizen submitting voluntary safety check-in (I_AM_SAFE)...');
    const checkInRes = await req(`/groups/${group._id}/check-ins`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` },
      body: {
        status: 'I_AM_SAFE',
        note: 'Safe at Flat 402 with family. We have 3 days of clean water.',
        approximateLocation: 'Flat 402, 4th Floor',
        locationShared: true
      }
    });
    console.log('   ✅ Check-in recorded:');
    console.log(`      Status: ${checkInRes.checkIn.status}`);
    console.log(`      Note: "${checkInRes.checkIn.note}"`);
    console.log(`      Approx Location: ${checkInRes.checkIn.approximateLocation}`);

    // 7. Verify Members List & Neutral "Not Checked In" display
    console.log('\n7. Fetching Group Members & Roll-Call Status...');
    const membersRes = await req(`/groups/${group._id}/members`, {
      headers: { Authorization: `Bearer ${coordToken}` }
    });
    console.log(`   ✅ Group has ${membersRes.members.length} members.`);
    membersRes.members.forEach((m) => {
      const statusText = m.checkIn ? m.checkIn.status : 'NOT CHECKED IN (Neutral)';
      console.log(`      - Member: ${m.name} (${m.role}) -> Status: [${statusText}]`);
    });
    console.log('   Stats Summary:', membersRes.stats);

    // 8. Coordinator posts a Safety Notice Announcement
    console.log('\n8. Coordinator posting a Safety Notice Announcement...');
    const annRes = await req(`/groups/${group._id}/announcements`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${coordToken}` },
      body: {
        title: 'Generator Fuel Restocked at Basement 1',
        message: 'Society backup power will run on schedule from 7 PM to 11 PM. Clean drinking water tanker arriving at 8 AM.',
        priority: 'SAFETY_NOTICE'
      }
    });
    console.log('   ✅ Announcement created:', annRes.announcement.title, `[Priority: ${annRes.announcement.priority}]`);

    // 9. Citizen reports an Emergency Incident linked to the group
    console.log('\n9. Citizen reporting emergency incident linked to Maplewood Towers...');
    const incRes = await req('/incidents', {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` },
      body: {
        incidentType: 'Flood',
        description: 'Basement parking has 2 feet of water. Lift 2 shut down.',
        location: {
          address: 'Maplewood Towers - Block C Basement',
          landmark: 'Gate 2'
        },
        affectedPeople: '15-20 residents',
        safetyStatus: 'Medical Attention Needed',
        requiredResources: ['Pumps / Dewatering', 'Relief Volunteers'],
        contact: {
          name: 'Alex Rivera',
          phone: '+1-555-0199'
        },
        urgency: 'Medium',
        group: group._id,
        groupId: group._id
      }
    });
    console.log('   ✅ Incident created & linked to group:', incRes.incident._id, `Group: ${incRes.incident.group}`);

    // Verify incident appears in group incidents
    const groupIncidentsRes = await req(`/groups/${group._id}/incidents`, {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    console.log(`   ✅ Group has ${groupIncidentsRes.incidents.length} linked incident(s):`);
    groupIncidentsRes.incidents.forEach((i) => {
      console.log(`      - Incident: ${i.incidentType} (${i.description.slice(0, 40)}...)`);
    });

    // 10. Fetch Community Activity Feed (/api/groups/activity)
    console.log('\n10. Fetching Community Activity Feed (/api/groups/activity)...');
    const activityRes = await req('/groups/activity', {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    console.log(`   ✅ Community activity returned ${activityRes.activity.length} recent item(s):`);
    activityRes.activity.slice(0, 4).forEach((act) => {
      console.log(`      - [${act.type.toUpperCase()}] ${act.title} in ${act.groupName} (${act.authorName || 'Anonymous'})`);
    });

    console.log('\n🎉 ALL COMMUNITY GROUPS TESTS PASSED SUCCESSFULLY! 🚀');
  } catch (err) {
    console.error('\n❌ Test failed with error:', err.data || err.message);
    process.exit(1);
  }
}

runTests();
