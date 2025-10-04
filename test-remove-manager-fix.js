/**
 * Quick test to verify the remove manager fix
 */

const API_BASE = 'http://localhost:3001/api';

async function testRemoveManagerFix() {
  console.log('🧪 Testing Remove Manager Fix');
  console.log('='.repeat(40));

  try {
    // Get existing data
    const usersResponse = await fetch(`${API_BASE}/users`);
    const users = await usersResponse.json();
    
    const managersResponse = await fetch(`${API_BASE}/user-managers`);
    const managers = await managersResponse.json();
    
    console.log(`Found ${users.length} users and ${managers.length} manager relationships`);

    if (managers.length > 0) {
      // Test with existing manager relationship
      const testManager = managers[0];
      console.log(`\nTesting removal of: ${testManager.managerId} -> ${testManager.userId}`);
      
      const response = await fetch(`${API_BASE}/user-managers/${testManager.userId}/${testManager.managerId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ SUCCESS! Remove manager now works correctly');
        console.log('Results:', result.results);
      } else {
        console.log('❌ Still failing');
        console.log('Status:', response.status);
        console.log('Error:', result);
      }
    } else if (users.length >= 2) {
      // Create and test a new manager relationship
      const user1 = users[0];
      const user2 = users[1];
      
      console.log(`\nCreating test relationship: ${user2.id} -> ${user1.id}`);
      
      // Create manager relationship
      const assignResponse = await fetch(`${API_BASE}/user-managers/${user1.id}/${user2.id}`, {
        method: 'POST'
      });
      
      if (assignResponse.ok) {
        console.log('✅ Manager relationship created');
        
        // Now test removal
        console.log(`Testing removal: ${user2.id} -> ${user1.id}`);
        const removeResponse = await fetch(`${API_BASE}/user-managers/${user1.id}/${user2.id}`, {
          method: 'DELETE'
        });
        
        const removeResult = await removeResponse.json();
        
        if (removeResponse.ok) {
          console.log('✅ SUCCESS! Remove manager now works correctly');
          console.log('Results:', removeResult.results);
        } else {
          console.log('❌ Still failing');
          console.log('Status:', removeResponse.status);
          console.log('Error:', removeResult);
        }
      } else {
        console.log('❌ Failed to create manager relationship');
        const errorResult = await assignResponse.json();
        console.log('Error:', errorResult);
      }
    } else {
      console.log('❌ Need at least 2 users to test');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testRemoveManagerFix().catch(console.error);
