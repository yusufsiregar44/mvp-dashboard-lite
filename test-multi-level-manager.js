/**
 * Test script for multi-level manager assignment
 * 
 * This tests the scenario you described:
 * 1. John Doe has multiple subordinates (manager access to teams via subordinates)
 * 2. Franz Kafka becomes John's manager
 * 3. Franz should inherit access to teams where John has manager access
 */

const API_BASE = 'http://localhost:3001/api';

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
  }

  return response.json();
}

async function testMultiLevelManager() {
  console.log('🧪 Testing Multi-Level Manager Assignment');
  console.log('='.repeat(50));

  try {
    // Step 1: Create test users
    console.log('\n📝 Step 1: Creating test users...');
    
    const johnDoe = await request('/users', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'Senior RM'
      })
    });
    
    const franzKafka = await request('/users', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Franz Kafka',
        email: 'franz.kafka@example.com',
        role: 'Head of RM'
      })
    });
    
    const subordinate1 = await request('/users', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Alice Smith',
        email: 'alice.smith@example.com',
        role: 'RM'
      })
    });
    
    const subordinate2 = await request('/users', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        role: 'RM'
      })
    });
    
    console.log('✓ Created users:');
    console.log(`  - ${johnDoe.name} (${johnDoe.id})`);
    console.log(`  - ${franzKafka.name} (${franzKafka.id})`);
    console.log(`  - ${subordinate1.name} (${subordinate1.id})`);
    console.log(`  - ${subordinate2.name} (${subordinate2.id})`);

    // Step 2: Create test teams
    console.log('\n📝 Step 2: Creating test teams...');
    
    const team1 = await request('/teams', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Sales Team Alpha'
      })
    });
    
    const team2 = await request('/teams', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Sales Team Beta'
      })
    });
    
    console.log('✓ Created teams:');
    console.log(`  - ${team1.name} (${team1.id})`);
    console.log(`  - ${team2.name} (${team2.id})`);

    // Step 3: Add subordinates to teams (John will get manager access via them)
    console.log('\n📝 Step 3: Adding subordinates to teams...');
    
    await request('/team-members', {
      method: 'POST',
      body: JSON.stringify({
        teamId: team1.id,
        userId: subordinate1.id,
        accessType: 'direct',
        grantedVia: null
      })
    });
    
    await request('/team-members', {
      method: 'POST',
      body: JSON.stringify({
        teamId: team2.id,
        userId: subordinate2.id,
        accessType: 'direct',
        grantedVia: null
      })
    });
    
    console.log('✓ Added subordinates to teams:');
    console.log(`  - ${subordinate1.name} added to ${team1.name} (direct)`);
    console.log(`  - ${subordinate2.name} added to ${team2.name} (direct)`);

    // Step 4: Assign John as manager of subordinates
    console.log('\n📝 Step 4: Assigning John as manager of subordinates...');
    
    await request(`/user-managers/${subordinate1.id}/${johnDoe.id}`, { method: 'POST' });
    await request(`/user-managers/${subordinate2.id}/${johnDoe.id}`, { method: 'POST' });
    
    console.log('✓ John assigned as manager of subordinates:');
    console.log(`  - John manages ${subordinate1.name}`);
    console.log(`  - John manages ${subordinate2.name}`);

    // Step 5: Check John's team access (should have manager access to both teams)
    console.log('\n📝 Step 5: Checking John\'s team access...');
    
    const johnTeamMemberships = await request('/team-members');
    const johnAccess = johnTeamMemberships.filter(tm => tm.userId === johnDoe.id);
    
    console.log('John\'s team access:');
    johnAccess.forEach(access => {
      const teamName = access.teamId === team1.id ? team1.name : team2.name;
      console.log(`  - ${teamName} (${access.accessType}${access.grantedVia ? ` via ${access.grantedVia}` : ''})`);
    });

    // Step 6: Assign Franz as manager of John (THIS IS THE KEY TEST)
    console.log('\n📝 Step 6: Assigning Franz as manager of John...');
    console.log('This should give Franz access to both teams where John has manager access');
    
    const assignResults = await request(`/user-managers/${johnDoe.id}/${franzKafka.id}`, { method: 'POST' });
    
    console.log('Assign manager results:');
    assignResults.results.forEach(result => {
      console.log(`  ${result}`);
    });

    // Step 7: Check Franz's team access (should now have manager access to both teams)
    console.log('\n📝 Step 7: Checking Franz\'s team access...');
    
    const franzTeamMemberships = await request('/team-members');
    const franzAccess = franzTeamMemberships.filter(tm => tm.userId === franzKafka.id);
    
    console.log('Franz\'s team access:');
    franzAccess.forEach(access => {
      const teamName = access.teamId === team1.id ? team1.name : team2.name;
      console.log(`  - ${teamName} (${access.accessType}${access.grantedVia ? ` via ${access.grantedVia}` : ''})`);
    });

    // Step 8: Verify the hierarchy
    console.log('\n📝 Step 8: Verifying the complete hierarchy...');
    
    const allTeamMemberships = await request('/team-members');
    
    console.log('Complete team memberships:');
    allTeamMemberships.forEach(tm => {
      const userName = [johnDoe, franzKafka, subordinate1, subordinate2].find(u => u.id === tm.userId)?.name || tm.userId;
      const teamName = tm.teamId === team1.id ? team1.name : tm.teamId === team2.id ? team2.name : tm.teamId;
      const grantedViaName = tm.grantedVia ? [johnDoe, franzKafka, subordinate1, subordinate2].find(u => u.id === tm.grantedVia)?.name || tm.grantedVia : null;
      
      console.log(`  - ${userName} → ${teamName} (${tm.accessType}${grantedViaName ? ` via ${grantedViaName}` : ''})`);
    });

    console.log('\n✅ Test completed successfully!');
    console.log('\nExpected result: Franz should have manager access to both teams via John');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testMultiLevelManager();
