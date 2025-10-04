/**
 * Comprehensive test to verify Actions 3 and 4 work correctly together
 * 
 * This test verifies the exact scenario from the Key Actions document:
 * 1. Assign Manager (Action 3) - creates proper hierarchy with correct granted_via
 * 2. Remove Manager (Action 4) - properly cleans up access based on granted_via
 */

const API_BASE = 'http://localhost:3001/api';

async function testActions3And4Integration() {
  console.log('🧪 Testing Actions 3 & 4 Integration');
  console.log('='.repeat(50));

  try {
    // Step 1: Create test users
    console.log('\n📝 Step 1: Creating test users...');
    const users = await createTestUsers();
    console.log('✓ Created users:', users.map(u => `${u.name} (${u.id})`).join(', '));

    // Step 2: Create test team
    console.log('\n📝 Step 2: Creating test team...');
    const team = await createTestTeam();
    console.log('✓ Created team:', `${team.name} (${team.id})`);

    // Step 3: Add Alex to Team 1 (direct member)
    console.log('\n📝 Step 3: Adding Alex to Team 1...');
    await addUserToTeam(users.alex.id, team.id);
    console.log('✓ Alex added to Team 1 as direct member');

    // Step 4: Assign Roger as manager of Moe (existing hierarchy)
    console.log('\n📝 Step 4: Assigning Roger as manager of Moe...');
    await assignManager(users.moe.id, users.roger.id);
    console.log('✓ Roger assigned as manager of Moe');

    // Step 5: Verify initial state
    console.log('\n📝 Step 5: Checking initial team memberships...');
    const initialMemberships = await getTeamMemberships(team.id);
    console.log('Initial team memberships:');
    initialMemberships.forEach(m => {
      console.log(`  - ${m.userName} (${m.accessType}${m.grantedVia ? ` via ${m.grantedViaName}` : ''})`);
    });

    // Step 6: ACTION 3 - Assign Moe as manager of Alex
    console.log('\n📝 Step 6: ACTION 3 - Assigning Moe as manager of Alex...');
    const assignResults = await assignManager(users.alex.id, users.moe.id);
    console.log('Assign manager results:');
    assignResults.forEach(result => console.log(`  ${result}`));

    // Step 7: Verify Action 3 results
    console.log('\n📝 Step 7: Verifying Action 3 results...');
    const afterAssignMemberships = await getTeamMemberships(team.id);
    console.log('Team memberships after Action 3:');
    afterAssignMemberships.forEach(m => {
      console.log(`  - ${m.userName} (${m.accessType}${m.grantedVia ? ` via ${m.grantedViaName}` : ''})`);
    });

    // Verify Action 3 requirements
    const alexMembership = afterAssignMemberships.find(m => m.userName === 'Alex');
    const moeMembership = afterAssignMemberships.find(m => m.userName === 'Moe');
    const rogerMembership = afterAssignMemberships.find(m => m.userName === 'Roger');

    console.log('\n🔍 Action 3 Verification:');
    console.log(`Alex (direct): ${alexMembership ? '✓' : '❌'}`);
    console.log(`Moe (manager via Alex): ${moeMembership && moeMembership.grantedViaName === 'Alex' ? '✓' : '❌'}`);
    console.log(`Roger (manager via Moe): ${rogerMembership && rogerMembership.grantedViaName === 'Moe' ? '✓' : '❌'}`);

    const action3Correct = alexMembership && 
                          moeMembership && moeMembership.grantedViaName === 'Alex' &&
                          rogerMembership && rogerMembership.grantedViaName === 'Moe';

    if (action3Correct) {
      console.log('✅ Action 3 (Assign Manager) working correctly!');
    } else {
      console.log('❌ Action 3 (Assign Manager) has issues!');
    }

    // Step 8: ACTION 4 - Remove Moe as manager of Alex
    console.log('\n📝 Step 8: ACTION 4 - Removing Moe as manager of Alex...');
    const removeResults = await removeManager(users.alex.id, users.moe.id);
    console.log('Remove manager results:');
    removeResults.forEach(result => console.log(`  ${result}`));

    // Step 9: Verify Action 4 results
    console.log('\n📝 Step 9: Verifying Action 4 results...');
    const afterRemoveMemberships = await getTeamMemberships(team.id);
    console.log('Team memberships after Action 4:');
    afterRemoveMemberships.forEach(m => {
      console.log(`  - ${m.userName} (${m.accessType}${m.grantedVia ? ` via ${m.grantedViaName}` : ''})`);
    });

    // Verify Action 4 requirements
    const finalAlexMembership = afterRemoveMemberships.find(m => m.userName === 'Alex');
    const finalMoeMembership = afterRemoveMemberships.find(m => m.userName === 'Moe');
    const finalRogerMembership = afterRemoveMemberships.find(m => m.userName === 'Roger');

    console.log('\n🔍 Action 4 Verification:');
    console.log(`Alex (direct): ${finalAlexMembership ? '✓' : '❌'}`);
    console.log(`Moe (removed): ${!finalMoeMembership ? '✓' : '❌'}`);
    console.log(`Roger (removed): ${!finalRogerMembership ? '✓' : '❌'}`);

    const action4Correct = finalAlexMembership && 
                          !finalMoeMembership && 
                          !finalRogerMembership;

    if (action4Correct) {
      console.log('✅ Action 4 (Remove Manager) working correctly!');
    } else {
      console.log('❌ Action 4 (Remove Manager) has issues!');
    }

    // Final verification
    console.log('\n🎯 Final Integration Test Result:');
    if (action3Correct && action4Correct) {
      console.log('✅ SUCCESS: Actions 3 and 4 work correctly together!');
      console.log('   - Action 3 creates proper manager hierarchy with correct granted_via');
      console.log('   - Action 4 properly cleans up access based on granted_via');
      console.log('   - Both functions fulfill the Key Actions requirements');
    } else {
      console.log('❌ FAILURE: Actions 3 and 4 have integration issues');
      console.log(`   - Action 3 correct: ${action3Correct}`);
      console.log(`   - Action 4 correct: ${action4Correct}`);
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await cleanupTestData(users, team);

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    console.error(error);
  }
}

async function createTestUsers() {
  const userData = [
    { name: 'Alex', email: 'alex@test.com', role: 'IC' },
    { name: 'Moe', email: 'moe@test.com', role: 'Manager' },
    { name: 'Roger', email: 'roger@test.com', role: 'Senior Manager' }
  ];

  const users = {};
  for (const data of userData) {
    const response = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const user = await response.json();
    users[data.name.toLowerCase()] = user;
  }
  
  return users;
}

async function createTestTeam() {
  const response = await fetch(`${API_BASE}/teams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test Team Integration' })
  });
  return await response.json();
}

async function addUserToTeam(userId, teamId) {
  const response = await fetch(`${API_BASE}/actions/add-user-to-team`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, teamId })
  });
  return await response.json();
}

async function assignManager(userId, managerId) {
  const response = await fetch(`${API_BASE}/actions/assign-manager`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, managerId })
  });
  const result = await response.json();
  return result.results || [];
}

async function removeManager(userId, managerId) {
  const response = await fetch(`${API_BASE}/actions/remove-manager`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, managerId })
  });
  const result = await response.json();
  return result.results || [];
}

async function getTeamMemberships(teamId) {
  const response = await fetch(`${API_BASE}/team-members?teamId=${teamId}`);
  const memberships = await response.json();
  
  // Get user names for better readability
  const membershipsWithNames = await Promise.all(
    memberships.map(async (m) => {
      const userResponse = await fetch(`${API_BASE}/users/${m.userId}`);
      const user = await userResponse.json();
      
      let grantedViaName = null;
      if (m.grantedVia) {
        const grantedViaResponse = await fetch(`${API_BASE}/users/${m.grantedVia}`);
        const grantedViaUser = await grantedViaResponse.json();
        grantedViaName = grantedViaUser.name;
      }
      
      return {
        ...m,
        userName: user.name,
        grantedViaName
      };
    })
  );
  
  return membershipsWithNames;
}

async function cleanupTestData(users, team) {
  // Delete team memberships
  for (const user of Object.values(users)) {
    try {
      await fetch(`${API_BASE}/team-members/${team.id}/${user.id}`, { method: 'DELETE' });
    } catch (e) { /* ignore */ }
  }
  
  // Delete manager relationships
  try {
    await fetch(`${API_BASE}/user-managers/${users.alex.id}/${users.moe.id}`, { method: 'DELETE' });
  } catch (e) { /* ignore */ }
  
  try {
    await fetch(`${API_BASE}/user-managers/${users.moe.id}/${users.roger.id}`, { method: 'DELETE' });
  } catch (e) { /* ignore */ }
  
  // Delete team
  try {
    await fetch(`${API_BASE}/teams/${team.id}`, { method: 'DELETE' });
  } catch (e) { /* ignore */ }
  
  // Delete users
  for (const user of Object.values(users)) {
    try {
      await fetch(`${API_BASE}/users/${user.id}`, { method: 'DELETE' });
    } catch (e) { /* ignore */ }
  }
}

// Run the integration test
testActions3And4Integration().catch(console.error);
