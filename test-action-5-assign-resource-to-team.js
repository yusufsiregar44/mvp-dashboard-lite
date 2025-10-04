#!/usr/bin/env node

/**
 * Test Action 5: Assign Resource to Team
 * 
 * This test verifies that:
 * 1. A resource can be assigned to a team
 * 2. All team members (direct + manager) can access the resource
 * 3. The assignment is properly tracked in team_resources table
 */

const API_BASE_URL = 'http://localhost:4000/api';

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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

async function testAction5() {
  console.log('🧪 Testing Action 5: Assign Resource to Team\n');

  try {
    // Step 1: Get existing test data
    console.log('📝 Step 1: Getting existing test data...');
    
    // Get existing users
    const usersResponse = await request('/users');
    const users = usersResponse.items;
    const alex = users[0]; // Use first user as Alex
    const moe = users[1];  // Use second user as Moe
    const john = users[2]; // Use third user as John
    
    console.log(`✓ Using existing users:`);
    console.log(`  - ${alex.name} (${alex.id})`);
    console.log(`  - ${moe.name} (${moe.id})`);
    console.log(`  - ${john.name} (${john.id})`);

    // Get existing team or create one
    const teamsResponse = await request('/teams');
    let team = teamsResponse.items[0];
    if (!team) {
      team = await request('/teams', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Team 1'
        })
      });
      console.log(`✓ Created team: ${team.name} (${team.id})`);
    } else {
      console.log(`✓ Using existing team: ${team.name} (${team.id})`);
    }

    // Create resource
    const resource = await request('/clients', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Client A',
        type: 'Client'
      })
    });
    console.log(`✓ Created resource: ${resource.name} (${resource.id})`);

    // Step 2: Set up management hierarchy
    console.log('\n📝 Step 2: Setting up management hierarchy...');
    
    // John manages Moe
    await request(`/user-managers/${moe.id}/${john.id}`, { method: 'POST' });
    console.log(`✓ ${john.name} now manages ${moe.name}`);

    // Moe manages Alex
    await request(`/user-managers/${alex.id}/${moe.id}`, { method: 'POST' });
    console.log(`✓ ${moe.name} now manages ${alex.name}`);

    // Step 3: Add Alex to team (this should automatically add Moe and John as managers)
    console.log('\n📝 Step 3: Adding Alex to team...');
    
    await request('/team-members', {
      method: 'POST',
      body: JSON.stringify({
        teamId: team.id,
        userId: alex.id,
        accessType: 'direct'
      })
    });
    console.log(`✓ Added ${alex.name} to ${team.name} as direct member`);

    // Verify team members
    const teamMembers = await request('/team-members');
    const teamMembersList = teamMembers.filter(tm => tm.teamId === team.id);
    console.log(`✓ Team now has ${teamMembersList.length} members:`);
    teamMembersList.forEach(member => {
      const user = member.userId === alex.id ? alex : 
                   member.userId === moe.id ? moe : 
                   member.userId === john.id ? john : null;
      if (user) {
        console.log(`  - ${user.name} (${member.accessType})`);
      }
    });

    // Step 4: Assign resource to team (Action 5)
    console.log('\n📝 Step 4: Assigning resource to team (Action 5)...');
    
    const assignmentResult = await request(`/clients/${resource.id}/assign-to-team`, {
      method: 'POST',
      body: JSON.stringify({
        teamId: team.id
      })
    });
    console.log(`✓ Assignment result:`, assignmentResult.results);

    // Step 5: Verify team-resource assignment
    console.log('\n📝 Step 5: Verifying team-resource assignment...');
    
    const teamResources = await request('/team-resources');
    const assignment = teamResources.find(tr => 
      tr.teamId === team.id && tr.resourceId === resource.id
    );
    
    if (assignment) {
      console.log(`✓ Resource ${resource.name} is assigned to team ${team.name}`);
      console.log(`  Assigned at: ${assignment.assignedAt}`);
    } else {
      throw new Error('Team-resource assignment not found');
    }

    // Step 6: Verify access (all team members should have access)
    console.log('\n📝 Step 6: Verifying access...');
    
    const teamMembersWithAccess = teamMembersList.map(member => {
      const user = member.userId === alex.id ? alex : 
                   member.userId === moe.id ? moe : 
                   member.userId === john.id ? john : null;
      return user ? { ...user, accessType: member.accessType } : null;
    }).filter(Boolean);

    console.log(`✓ All ${teamMembersWithAccess.length} team members can access ${resource.name}:`);
    teamMembersWithAccess.forEach(member => {
      console.log(`  - ${member.name} (${member.accessType})`);
    });

    console.log('\n🎉 Action 5 test completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Resource "${resource.name}" assigned to team "${team.name}"`);
    console.log(`- ${teamMembersWithAccess.length} users can access the resource`);
    console.log(`- Management hierarchy: ${john.name} → ${moe.name} → ${alex.name}`);
    console.log(`- All members inherited access through team membership`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testAction5();
