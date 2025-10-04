/**
 * Test script for edge case: Manager with multiple subordinates
 * 
 * This tests the scenario from Action 4 edge case:
 * - Moe manages both Alex and Bob (both in Team 1)
 * - Roger manages Moe
 * 
 * When we remove Moe as manager of Alex:
 * - Moe should STAY in Team 1 (still manages Bob)
 * - Roger should STAY in Team 1 (still manages Moe)
 * 
 * When we remove Moe as manager of Bob:
 * - NOW Moe should be removed from Team 1 (no other path)
 * - NOW Roger should be removed from Team 1 (no other path)
 */

const API_BASE = 'http://localhost:3001/api';

async function testRemoveManagerEdgeCase() {
  console.log('🧪 Testing Remove Manager Edge Case (Multiple Subordinates)');
  console.log('='.repeat(70));

  try {
    // Step 1: Create test users
    console.log('\n📝 Step 1: Creating test users...');
    const users = await createTestUsers();
    console.log('✓ Created users:', users.map(u => `${u.name} (${u.id})`).join(', '));

    // Step 2: Create test team
    console.log('\n📝 Step 2: Creating test team...');
    const team = await createTestTeam();
    console.log('✓ Created team:', `${team.name} (${team.id})`);

    // Step 3: Add Alex and Bob to Team 1 (direct members)
    console.log('\n📝 Step 3: Adding Alex and Bob to Team 1...');
    await addUserToTeam(users.alex.id, team.id);
    await addUserToTeam(users.bob.id, team.id);
    console.log('✓ Alex and Bob added to Team 1 as direct members');

    // Step 4: Assign Moe as manager of both Alex and Bob
    console.log('\n📝 Step 4: Assigning Moe as manager of Alex and Bob...');
    await assignManager(users.alex.id, users.moe.id);
    await assignManager(users.bob.id, users.moe.id);
    console.log('✓ Moe assigned as manager of both Alex and Bob');

    // Step 5: Assign Roger as manager of Moe
    console.log('\n📝 Step 5: Assigning Roger as manager of Moe...');
    await assignManager(users.moe.id, users.roger.id);
    console.log('✓ Roger assigned as manager of Moe');

    // Step 6: Verify initial team memberships
    console.log('\n📝 Step 6: Checking initial team memberships...');
    const initialMemberships = await getTeamMemberships(team.id);
    console.log('Initial team memberships:');
    initialMemberships.forEach(m => {
      console.log(`  - ${m.userName} (${m.accessType}${m.grantedVia ? ` via ${m.grantedViaName}` : ''})`);
    });

    // Step 7: Remove Moe as manager of Alex (should keep Moe and Roger)
    console.log('\n📝 Step 7: Removing Moe as manager of Alex...');
    const removeResults1 = await removeManager(users.alex.id, users.moe.id);
    console.log('Remove manager results:');
    removeResults1.forEach(result => console.log(`  ${result}`));

    // Step 8: Verify team memberships after first removal
    console.log('\n📝 Step 8: Checking team memberships after removing Moe->Alex...');
    const membershipsAfterFirst = await getTeamMemberships(team.id);
    console.log('Team memberships after removing Moe->Alex:');
    membershipsAfterFirst.forEach(m => {
      console.log(`  - ${m.userName} (${m.accessType}${m.grantedVia ? ` via ${m.grantedViaName}` : ''})`);
    });

    // Step 9: Verify Moe and Roger are still in team
    const expectedAfterFirst = [users.alex.name, users.bob.name, users.moe.name, users.roger.name];
    const actualAfterFirst = membershipsAfterFirst.map(m => m.userName);
    const isCorrectAfterFirst = JSON.stringify(expectedAfterFirst.sort()) === JSON.stringify(actualAfterFirst.sort());
    
    if (isCorrectAfterFirst) {
      console.log('✅ SUCCESS: Moe and Roger correctly remain in team (Moe still manages Bob)');
    } else {
      console.log('❌ FAILURE: Moe and Roger should still be in team');
      console.log('   Expected:', expectedAfterFirst);
      console.log('   Actual:', actualAfterFirst);
    }

    // Step 10: Remove Moe as manager of Bob (should remove Moe and Roger)
    console.log('\n📝 Step 10: Removing Moe as manager of Bob...');
    const removeResults2 = await removeManager(users.bob.id, users.moe.id);
    console.log('Remove manager results:');
    removeResults2.forEach(result => console.log(`  ${result}`));

    // Step 11: Verify final team memberships
    console.log('\n📝 Step 11: Checking final team memberships...');
    const finalMemberships = await getTeamMemberships(team.id);
    console.log('Final team memberships:');
    finalMemberships.forEach(m => {
      console.log(`  - ${m.userName} (${m.accessType}${m.grantedVia ? ` via ${m.grantedViaName}` : ''})`);
    });

    // Step 12: Verify expected final results
    console.log('\n📝 Step 12: Verifying final results...');
    const expectedFinal = [users.alex.name, users.bob.name]; // Only direct members should remain
    const actualFinal = finalMemberships.map(m => m.userName);
    
    console.log('Expected final members:', expectedFinal);
    console.log('Actual final members:', actualFinal);
    
    const isCorrectFinal = JSON.stringify(expectedFinal.sort()) === JSON.stringify(actualFinal.sort());
    
    if (isCorrectFinal) {
      console.log('✅ SUCCESS: Edge case handled correctly!');
      console.log('   - Alex and Bob remain in Team 1 (direct members)');
      console.log('   - Moe was removed from Team 1 (no other path after removing Bob)');
      console.log('   - Roger was removed from Team 1 (no other path after removing Moe)');
    } else {
      console.log('❌ FAILURE: Edge case not handled correctly');
      console.log('   Expected:', expectedFinal);
      console.log('   Actual:', actualFinal);
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await cleanupTestData(users, team);

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error(error);
  }
}

async function createTestUsers() {
  const userData = [
    { name: 'Alex', email: 'alex@test.com', role: 'IC' },
    { name: 'Bob', email: 'bob@test.com', role: 'IC' },
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
    body: JSON.stringify({ name: 'Test Team Edge Case' })
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
  return await response.json();
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
    await fetch(`${API_BASE}/user-managers/${users.bob.id}/${users.moe.id}`, { method: 'DELETE' });
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

// Run the test
testRemoveManagerEdgeCase().catch(console.error);
