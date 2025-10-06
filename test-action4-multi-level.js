/**
 * Test script to verify Action 4 (Remove Manager) works correctly with multi-level hierarchies
 * 
 * This test verifies that when removing a manager, the system correctly handles
 * teams where the user has BOTH direct and manager access.
 */

const API_BASE = 'http://localhost:3001';

async function makeRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`);
  return response.json();
}

async function testAction4MultiLevel() {
  console.log('🧪 Testing Action 4 Multi-Level Hierarchy Fix\n');
  
  try {
    // Step 1: Create test users
    console.log('Step 1: Creating test users...');
    const alice = await makeRequest('/users', 'POST', {
      name: 'Alice Smith',
      email: 'alice@test.com',
      role: 'IC'
    });
    const bob = await makeRequest('/users', 'POST', {
      name: 'Bob Johnson', 
      email: 'bob@test.com',
      role: 'IC'
    });
    const john = await makeRequest('/users', 'POST', {
      name: 'John Doe',
      email: 'john@test.com', 
      role: 'Manager'
    });
    const franz = await makeRequest('/users', 'POST', {
      name: 'Franz Kafka',
      email: 'franz@test.com',
      role: 'Senior Manager'
    });
    
    console.log(`✓ Created users: Alice (${alice.userId}), Bob (${bob.userId}), John (${john.userId}), Franz (${franz.userId})\n`);
    
    // Step 2: Create test teams
    console.log('Step 2: Creating test teams...');
    const teamAlpha = await makeRequest('/teams', 'POST', {
      name: 'Sales Team Alpha',
      description: 'Alpha sales team'
    });
    const teamBeta = await makeRequest('/teams', 'POST', {
      name: 'Sales Team Beta', 
      description: 'Beta sales team'
    });
    
    console.log(`✓ Created teams: Alpha (${teamAlpha.teamId}), Beta (${teamBeta.teamId})\n`);
    
    // Step 3: Set up multi-level hierarchy
    console.log('Step 3: Setting up multi-level hierarchy...');
    
    // Alice joins Team Alpha (direct member)
    await makeRequest('/actions/add-user-to-team', 'POST', {
      userId: alice.userId,
      teamId: teamAlpha.teamId
    });
    console.log('✓ Alice joined Team Alpha (direct member)');
    
    // Bob joins Team Beta (direct member)  
    await makeRequest('/actions/add-user-to-team', 'POST', {
      userId: bob.userId,
      teamId: teamBeta.teamId
    });
    console.log('✓ Bob joined Team Beta (direct member)');
    
    // John manages Alice (gets manager access to Team Alpha)
    await makeRequest('/actions/assign-manager', 'POST', {
      userId: alice.userId,
      managerId: john.userId
    });
    console.log('✓ John manages Alice (manager access to Team Alpha)');
    
    // John manages Bob (gets manager access to Team Beta)
    await makeRequest('/actions/assign-manager', 'POST', {
      userId: bob.userId,
      managerId: john.userId
    });
    console.log('✓ John manages Bob (manager access to Team Beta)');
    
    // Franz manages John (gets manager access to both teams via John)
    await makeRequest('/actions/assign-manager', 'POST', {
      userId: john.userId,
      managerId: franz.userId
    });
    console.log('✓ Franz manages John (manager access to both teams via John)\n');
    
    // Step 4: Verify initial state
    console.log('Step 4: Verifying initial state...');
    const teamMembers = await makeRequest('/team-members');
    
    console.log('Team memberships:');
    teamMembers.forEach(member => {
      const accessType = member.accessType === 'direct' ? 'direct' : `manager via ${member.grantedVia}`;
      console.log(`  - ${member.userId} → ${member.teamId} (${accessType})`);
    });
    console.log('');
    
    // Step 5: Test the fix - Remove John as Alice's manager
    console.log('Step 5: Testing Action 4 fix - Remove John as Alice\'s manager...');
    const removeResult = await makeRequest('/actions/remove-manager', 'POST', {
      userId: alice.userId,
      managerId: john.userId
    });
    
    console.log('Remove manager result:');
    removeResult.forEach(result => console.log(`  ${result}`));
    console.log('');
    
    // Step 6: Verify final state
    console.log('Step 6: Verifying final state...');
    const finalTeamMembers = await makeRequest('/team-members');
    
    console.log('Final team memberships:');
    finalTeamMembers.forEach(member => {
      const accessType = member.accessType === 'direct' ? 'direct' : `manager via ${member.grantedVia}`;
      console.log(`  - ${member.userId} → ${member.teamId} (${accessType})`);
    });
    console.log('');
    
    // Step 7: Verify the fix worked correctly
    console.log('Step 7: Verifying the fix worked correctly...');
    
    const aliceAlpha = finalTeamMembers.find(m => m.userId === alice.userId && m.teamId === teamAlpha.teamId);
    const johnAlpha = finalTeamMembers.find(m => m.userId === john.userId && m.teamId === teamAlpha.teamId);
    const franzAlpha = finalTeamMembers.find(m => m.userId === franz.userId && m.teamId === teamAlpha.teamId);
    
    const johnBeta = finalTeamMembers.find(m => m.userId === john.userId && m.teamId === teamBeta.teamId);
    const franzBeta = finalTeamMembers.find(m => m.userId === franz.userId && m.teamId === teamBeta.teamId);
    
    console.log('✅ Expected Results:');
    console.log(`  - Alice should still be in Team Alpha (direct): ${aliceAlpha ? '✓' : '❌'}`);
    console.log(`  - John should be REMOVED from Team Alpha: ${!johnAlpha ? '✓' : '❌'}`);
    console.log(`  - Franz should be REMOVED from Team Alpha: ${!franzAlpha ? '✓' : '❌'}`);
    console.log(`  - John should STAY in Team Beta (still manages Bob): ${johnBeta ? '✓' : '❌'}`);
    console.log(`  - Franz should STAY in Team Beta (still manages John): ${franzBeta ? '✓' : '❌'}`);
    
    // Check if the fix worked
    const fixWorked = aliceAlpha && !johnAlpha && !franzAlpha && johnBeta && franzBeta;
    
    if (fixWorked) {
      console.log('\n🎉 SUCCESS: Action 4 multi-level hierarchy fix is working correctly!');
      console.log('   - John was correctly removed from Team Alpha (no other path)');
      console.log('   - Franz was correctly removed from Team Alpha (no other path via John)');
      console.log('   - John and Franz correctly stayed in Team Beta (still have other paths)');
    } else {
      console.log('\n❌ FAILURE: Action 4 multi-level hierarchy fix is not working correctly');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testAction4MultiLevel();
