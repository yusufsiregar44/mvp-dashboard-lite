import { db } from './src/db';
import { users, teams, resources, userManagers, teamMembers, teamResources } from './src/schema';

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // Clear existing data
    await db.delete(teamResources);
    await db.delete(teamMembers);
    await db.delete(userManagers);
    await db.delete(resources);
    await db.delete(teams);
    await db.delete(users);

    console.log('✅ Cleared existing data');

    // Insert users
    const insertedUsers = await db.insert(users).values([
      { id: '1', email: 'john.doe@alpheya.com', name: 'John Doe', role: 'Head of RM' },
      { id: '2', email: 'sarah.smith@alpheya.com', name: 'Sarah Smith', role: 'Senior RM' },
      { id: '3', email: 'mike.johnson@alpheya.com', name: 'Mike Johnson', role: 'Senior RM' },
      { id: '4', email: 'emma.wilson@alpheya.com', name: 'Emma Wilson', role: 'RM' },
      { id: '5', email: 'david.brown@alpheya.com', name: 'David Brown', role: 'RM' },
      { id: '6', email: 'lisa.garcia@alpheya.com', name: 'Lisa Garcia', role: 'RM' },
      { id: '7', email: 'tom.lee@alpheya.com', name: 'Tom Lee', role: 'RM' },
      { id: '8', email: 'anna.taylor@alpheya.com', name: 'Anna Taylor', role: 'Senior RM' },
    ]).returning();

    console.log('✅ Inserted users:', insertedUsers.length);

    // Insert teams
    const insertedTeams = await db.insert(teams).values([
      { id: 't1', name: 'Private Banking - APAC', autoAssignClients: true },
      { id: 't2', name: 'Corporate Banking - EMEA', autoAssignClients: false },
      { id: 't3', name: 'Retail Banking - Americas', autoAssignClients: true },
    ]).returning();

    console.log('✅ Inserted teams:', insertedTeams.length);

    // Insert resources
    const insertedResources = await db.insert(resources).values([
      { id: 'c1', name: 'TechCorp Industries', type: 'client', segment: 'Corporate' },
      { id: 'c2', name: 'Global Finance Ltd', type: 'client', segment: 'Private' },
      { id: 'c3', name: 'Startup Ventures', type: 'client', segment: 'Retail' },
      { id: 'c4', name: 'MegaCorp Holdings', type: 'client', segment: 'Corporate' },
      { id: 'c5', name: 'Family Trust Fund', type: 'client', segment: 'Private' },
    ]).returning();

    console.log('✅ Inserted resources:', insertedResources.length);

    // Insert user managers (hierarchy)
    const insertedUserManagers = await db.insert(userManagers).values([
      // John (Head) manages Sarah and Mike (Senior RMs)
      { userId: '2', managerId: '1' },
      { userId: '3', managerId: '1' },
      
      // Sarah manages Emma and David
      { userId: '4', managerId: '2' },
      { userId: '5', managerId: '2' },
      
      // Mike manages Lisa and Tom
      { userId: '6', managerId: '3' },
      { userId: '7', managerId: '3' },
      
      // Anna (Senior RM) reports to John
      { userId: '8', managerId: '1' },
    ]).returning();

    console.log('✅ Inserted user managers:', insertedUserManagers.length);

    // Insert team members
    const insertedTeamMembers = await db.insert(teamMembers).values([
      // Team 1 (Private Banking - APAC)
      { teamId: 't1', userId: '2', accessType: 'direct', grantedVia: null },
      { teamId: 't1', userId: '4', accessType: 'direct', grantedVia: null },
      { teamId: 't1', userId: '5', accessType: 'direct', grantedVia: null },
      
      // Team 2 (Corporate Banking - EMEA)
      { teamId: 't2', userId: '3', accessType: 'direct', grantedVia: null },
      { teamId: 't2', userId: '6', accessType: 'direct', grantedVia: null },
      { teamId: 't2', userId: '7', accessType: 'direct', grantedVia: null },
      
      // Team 3 (Retail Banking - Americas)
      { teamId: 't3', userId: '8', accessType: 'direct', grantedVia: null },
    ]).returning();

    console.log('✅ Inserted team members:', insertedTeamMembers.length);

    // Insert team resources
    const insertedTeamResources = await db.insert(teamResources).values([
      { teamId: 't1', resourceId: 'c2' }, // Private Banking team gets Private client
      { teamId: 't1', resourceId: 'c5' }, // Private Banking team gets Family Trust
      { teamId: 't2', resourceId: 'c1' }, // Corporate Banking team gets TechCorp
      { teamId: 't2', resourceId: 'c4' }, // Corporate Banking team gets MegaCorp
      { teamId: 't3', resourceId: 'c3' }, // Retail Banking team gets Startup Ventures
    ]).returning();

    console.log('✅ Inserted team resources:', insertedTeamResources.length);

    console.log('🎉 Database seeded successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Users: ${insertedUsers.length}`);
    console.log(`   - Teams: ${insertedTeams.length}`);
    console.log(`   - Resources: ${insertedResources.length}`);
    console.log(`   - User Managers: ${insertedUserManagers.length}`);
    console.log(`   - Team Members: ${insertedTeamMembers.length}`);
    console.log(`   - Team Resources: ${insertedTeamResources.length}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log('✅ Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
