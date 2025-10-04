/**
 * Test script to verify the remove manager functionality works according to Action 4
 * 
 * This script tests the scenario from the Key Actions document:
 * - Roger manages Moe
 * - Moe manages Alex  
 * - Alex is in Team 1
 * - Moe has manager access to Team 1 (via Alex)
 * - Roger has manager access to Team 1 (via Moe)
 * 
 * When we remove Moe as manager of Alex:
 * - Moe should be removed from Team 1 (no other path)
 * - Roger should be removed from Team 1 (no other path)
 */

const API_BASE = 'http://localhost:3001/api';

async function testRemoveManager() {
  console.log('🧪 Testing Remove Manager Functionality (Action 4)');
  console.log('='.repeat(60));

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

    // Step 4: Assign Moe as manager of Alex
    console.log('\n📝 Step 4: Assigning Moe as manager of Alex...');
    await assignManager(users.alex.id, users.moe.id);
    console.log('✓ Moe assigned as manager of Alex');

    // Step 5: Assign Roger as manager of Moe
    console.log('\n📝 Step 5: Assigning Roger as manager of Moe...');
    await assignManager(users.moe.id, users.roger.id);
    console.log('✓ Roger assigned as manager of Moe');

    // Step 6: Verify team memberships before removal
    console.log('\n📝 Step 6: Checking team memberships before removal...');
    const membershipsBefore = await getTeamMemberships(team.id);
    console.log('Team memberships before removal:');
    membershipsBefore.forEach(m => {
      console.log(`  - ${m.userName} (${m.accessType}${m.grantedVia ? ` via ${m.grantedViaName}` : ''})`);
    });

    // Step 7: Remove Moe as manager of Alex
    console.log('\n📝 Step 7: Removing Moe as manager of Alex...');
    const removeResults = await removeManager(users.alex.id, users.moe.id);
    console.log('Remove manager results:');
    removeResults.forEach(result => console.log(`  ${result}`));

    // Step 8: Verify team memberships after removal
    console.log('\n📝 Step 8: Checking team memberships after removal...');
    const membershipsAfter = await getTeamMemberships(team.id);
    console.log('Team memberships after removal:');
    membershipsAfter.forEach(m => {
      console.log(`  - ${m.userName} (${m.accessType}${m.grantedVia ? ` via ${m.grantedViaName}` : ''})`);
    });

    // Step 9: Verify expected results
    console.log('\n📝 Step 9: Verifying results...');
    const expectedMembers = [users.alex.name]; // Only Alex should remain
    const actualMembers = membershipsAfter.map(m => m.userName);
    
    console.log('Expected members:', expectedMembers);
    console.log('Actual members:', actualMembers);
    
    const isCorrect = JSON.stringify(expectedMembers.sort()) === JSON.stringify(actualMembers.sort());
    
    if (isCorrect) {
      console.log('✅ SUCCESS: Remove manager functionality works correctly!');
      console.log('   - Alex remains in Team 1 (direct member)');
      console.log('   - Moe was removed from Team 1 (no other path)');
      console.log('   - Roger was removed from Team 1 (no other path)');
    } else {
      console.log('❌ FAILURE: Remove manager functionality is not working correctly');
      console.log('   Expected:', expectedMembers);
      console.log('   Actual:', actualMembers);
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
    body: JSON.stringify({ name: 'Test Team 1' })
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
testRemoveManager().catch(console.error);
