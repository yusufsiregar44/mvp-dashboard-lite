import { db } from '../db';
import { teamMembers, userManagers, users, teamResources } from '../schema';
import { eq, and, or, sql, inArray } from 'drizzle-orm';

export class TeamService {
  /**
   * Action 1: Add User to Team
   * Adds user to team as direct member + automatically adds all their managers with inherited access
   */
  static async addUserToTeam(userId: string, teamId: string) {
    const results = [];
    
    // 1. Insert user as direct member
    const [directMember] = await db.insert(teamMembers).values({
      teamId,
      userId,
      accessType: 'direct',
      grantedVia: null,
    }).returning();
    
    results.push(`✓ Added ${userId} to ${teamId} as DIRECT member`);
    
    // 2. Query user's managers (recursive up to 3 levels)
    const managers = await this.getUserManagersRecursive(userId, 3);
    
    // 3. Insert each manager as 'manager' type with granted_via = user_id
    for (const manager of managers) {
      // Skip managers who are already direct members
      const existingDirect = await db.select()
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.teamId, teamId),
            eq(teamMembers.userId, manager.id),
            eq(teamMembers.accessType, 'direct')
          )
        )
        .limit(1);
      
      if (existingDirect.length === 0) {
        await db.insert(teamMembers).values({
          teamId,
          userId: manager.id,
          accessType: 'manager',
          grantedVia: userId,
        });
        
        results.push(`✓ Added ${manager.id} to ${teamId} as MANAGER (via ${userId})`);
      }
    }
    
    return results;
  }

  /**
   * Action 2: Remove User from Team
   * Removes user from team + removes managers if they have no other path to this team
   */
  static async removeUserFromTeam(userId: string, teamId: string) {
    const results = [];
    
    // 1. Delete user's direct membership
    await db.delete(teamMembers).where(
      and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, userId),
        eq(teamMembers.accessType, 'direct')
      )
    );
    
    results.push(`✓ Removed ${userId} from ${teamId}`);
    
    // 2. For each manager who had access via this user
    const managersViaUser = await db.select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.grantedVia, userId),
          eq(teamMembers.accessType, 'manager')
        )
      );
    
    for (const managerMembership of managersViaUser) {
      const managerId = managerMembership.userId;
      
      // Check if manager has OTHER subordinates still in team
      const otherSubordinates = await db.select()
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.teamId, teamId),
            eq(teamMembers.grantedVia, managerId),
            eq(teamMembers.accessType, 'manager')
          )
        );
      
      // Check if manager is a direct member themselves
      const isDirectMember = await db.select()
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.teamId, teamId),
            eq(teamMembers.userId, managerId),
            eq(teamMembers.accessType, 'direct')
          )
        )
        .limit(1);
      
      // If NO other path AND NOT direct: remove manager's access
      if (otherSubordinates.length === 0 && isDirectMember.length === 0) {
        await db.delete(teamMembers).where(
          and(
            eq(teamMembers.teamId, teamId),
            eq(teamMembers.userId, managerId),
            eq(teamMembers.grantedVia, userId)
          )
        );
        
        results.push(`✓ Removed ${managerId} from ${teamId} (no other path)`);
      }
    }
    
    return results;
  }

  /**
   * Action 3: Assign Manager
   * Creates manager relationship + manager inherits all user's existing teams + recursively add the manager's managers
   */
  static async assignManager(userId: string, managerId: string, assignedBy?: string) {
    const results = [];
    
    // 1. Validate: no self-management, no cycles, max depth not exceeded
    if (userId === managerId) {
      throw new Error('Cannot manage yourself');
    }
    
    // Check for cycles
    const wouldCreateCycle = await this.wouldCreateCycle(userId, managerId);
    if (wouldCreateCycle) {
      throw new Error('Cannot create circular management relationship');
    }
    
    // Check depth
    const depth = await this.getManagementDepth(managerId);
    if (depth >= 3) {
      throw new Error('Cannot exceed 3-level management depth');
    }
    
    // 2. Insert into user_managers
    await db.insert(userManagers).values({
      userId,
      managerId,
    });
    
    results.push(`✓ ${managerId} now manages ${userId}`);
    
    // 3. Find all teams where user is direct member
    const userTeams = await db.select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.userId, userId),
          eq(teamMembers.accessType, 'direct')
        )
      );
    
    // 4. Add manager to those teams with 'manager' access type
    for (const team of userTeams) {
      // Check if manager is already a direct member
      const existingDirect = await db.select()
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.teamId, team.teamId),
            eq(teamMembers.userId, managerId),
            eq(teamMembers.accessType, 'direct')
          )
        )
        .limit(1);
      
      if (existingDirect.length === 0) {
        await db.insert(teamMembers).values({
          teamId: team.teamId,
          userId: managerId,
          accessType: 'manager',
          grantedVia: userId,
        });
        
        results.push(`✓ ${managerId} inherited access to ${team.teamId} (via ${userId})`);
      }
    }
    
    // 5. Recursively add manager's managers to the same teams
    // We need to build the manager hierarchy correctly for proper granted_via tracking
    await this.addManagerHierarchyToTeams(managerId, userTeams, results);
    
    return results;
  }

  /**
   * Helper method to correctly add manager hierarchy to teams with proper granted_via tracking
   */
  private static async addManagerHierarchyToTeams(managerId: string, userTeams: Array<{teamId: string, userId: string, accessType: string, grantedVia: string | null, joinedAt: Date}>, results: string[]) {
    // Get all managers of the current manager
    const managerManagers = await db.select({ managerId: userManagers.managerId })
      .from(userManagers)
      .where(eq(userManagers.userId, managerId));
    
    for (const team of userTeams) {
      for (const managerManager of managerManagers) {
        const upperManagerId = managerManager.managerId;
        
        // Check if this upper manager is already a direct member
        const existingDirect = await db.select()
          .from(teamMembers)
          .where(
            and(
              eq(teamMembers.teamId, team.teamId),
              eq(teamMembers.userId, upperManagerId),
              eq(teamMembers.accessType, 'direct')
            )
          )
          .limit(1);
        
        // Check if this upper manager already has manager access
        const existingManager = await db.select()
          .from(teamMembers)
          .where(
            and(
              eq(teamMembers.teamId, team.teamId),
              eq(teamMembers.userId, upperManagerId),
              eq(teamMembers.accessType, 'manager')
            )
          )
          .limit(1);
        
        if (existingDirect.length === 0 && existingManager.length === 0) {
          // The upper manager's access is granted via the current manager
          await db.insert(teamMembers).values({
            teamId: team.teamId,
            userId: upperManagerId,
            accessType: 'manager',
            grantedVia: managerId, // This is the key fix: granted_via should be the direct manager
          });
          
          results.push(`✓ ${upperManagerId} inherited access to ${team.teamId} (via ${managerId})`);
          
          // Recursively add this manager's managers
          await this.addManagerHierarchyToTeams(upperManagerId, [team], results);
        }
      }
    }
  }

  /**
   * Action 4: Remove Manager
   * Removes manager relationship + recalculates team access for that manager
   */
  static async removeManager(userId: string, managerId: string) {
    const results = [];
    
    console.log(`Starting removeManager: userId=${userId}, managerId=${managerId}`);
    
    try {
      // 1. Delete from user_managers
      console.log('Step 1: Deleting manager relationship from user_managers table');
      await db.delete(userManagers).where(
        and(
          eq(userManagers.userId, userId),
          eq(userManagers.managerId, managerId)
        )
      );
      
      results.push(`✓ ${managerId} no longer manages ${userId}`);
      console.log('Step 1 completed: Manager relationship deleted');
      
      // 2. For each team where user is direct member
      console.log('Step 2: Finding teams where user is direct member');
      const userTeams = await db.select()
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.userId, userId),
            eq(teamMembers.accessType, 'direct')
          )
        );
      
      console.log(`Found ${userTeams.length} teams where user is direct member:`, userTeams.map(t => t.teamId));
      
      for (const team of userTeams) {
        console.log(`Processing team: ${team.teamId}`);
        
        // Check if manager has OTHER subordinates in that team
        // Get all users that this manager manages
        console.log('Getting all subordinates of manager');
        const managerSubordinates = await db.select({ userId: userManagers.userId })
          .from(userManagers)
          .where(eq(userManagers.managerId, managerId));
        
        const subordinateIds = managerSubordinates.map(s => s.userId);
        console.log(`Manager ${managerId} manages these users:`, subordinateIds);
        
        // Check if any of these subordinates are still in the team (excluding the current user)
        console.log('Checking for other subordinates in team');
        let otherSubordinatesInTeam: Array<{teamId: string, userId: string, accessType: string, grantedVia: string | null, joinedAt: Date}> = [];
        
        if (subordinateIds.length > 0) {
          otherSubordinatesInTeam = await db.select()
            .from(teamMembers)
            .where(
              and(
                eq(teamMembers.teamId, team.teamId),
                eq(teamMembers.accessType, 'direct'),
                inArray(teamMembers.userId, subordinateIds),
                sql`${teamMembers.userId} != ${userId}`
              )
            );
        }
        
        console.log(`Other subordinates in team ${team.teamId}:`, otherSubordinatesInTeam.map(s => s.userId));
        
        // Check if manager is direct member themselves
        console.log('Checking if manager is direct member');
        const isDirectMember = await db.select()
          .from(teamMembers)
          .where(
            and(
              eq(teamMembers.teamId, team.teamId),
              eq(teamMembers.userId, managerId),
              eq(teamMembers.accessType, 'direct')
            )
          )
          .limit(1);
        
        console.log(`Manager ${managerId} is direct member:`, isDirectMember.length > 0);
        
        // If NO other path AND NOT direct: remove manager's inherited access
        if (otherSubordinatesInTeam.length === 0 && isDirectMember.length === 0) {
          console.log(`Removing manager ${managerId} from team ${team.teamId} (no other path)`);
          
          await db.delete(teamMembers).where(
            and(
              eq(teamMembers.teamId, team.teamId),
              eq(teamMembers.userId, managerId),
              eq(teamMembers.grantedVia, userId)
            )
          );
          
          results.push(`✓ Removed ${managerId} from ${team.teamId} (no other path)`);
          
          // 3. Recursively check and remove manager's managers if they lose access
          console.log(`Recursively checking managers of ${managerId}`);
          await this.removeManagerFromTeamRecursively(managerId, team.teamId, results);
        } else {
          console.log(`Manager ${managerId} keeps access to team ${team.teamId} (has other path or is direct member)`);
        }
      }
      
      console.log('removeManager completed successfully');
      return results;
      
    } catch (error) {
      console.error('Error in removeManager:', error);
      throw error;
    }
  }

  /**
   * Helper method to recursively remove managers from team when they lose access
   */
  private static async removeManagerFromTeamRecursively(managerId: string, teamId: string, results: string[]) {
    console.log(`Recursively checking managers of ${managerId} for team ${teamId}`);
    
    try {
      // Get all managers of this manager
      const managerManagers = await db.select({ managerId: userManagers.managerId })
        .from(userManagers)
        .where(eq(userManagers.userId, managerId));
      
      console.log(`Found ${managerManagers.length} managers of ${managerId}:`, managerManagers.map(m => m.managerId));
      
      for (const managerManager of managerManagers) {
        const upperManagerId = managerManager.managerId;
        console.log(`Processing upper manager: ${upperManagerId}`);
        
        // Check if this upper manager has OTHER subordinates in the team
        const upperManagerSubordinates = await db.select({ userId: userManagers.userId })
          .from(userManagers)
          .where(eq(userManagers.managerId, upperManagerId));
        
        const upperSubordinateIds = upperManagerSubordinates.map(s => s.userId);
        console.log(`Upper manager ${upperManagerId} manages:`, upperSubordinateIds);
        
        // Check if any of these subordinates are still in the team (excluding the current manager)
        let otherSubordinatesInTeam: Array<{teamId: string, userId: string, accessType: string, grantedVia: string | null, joinedAt: Date}> = [];
        
        if (upperSubordinateIds.length > 0) {
          otherSubordinatesInTeam = await db.select()
            .from(teamMembers)
            .where(
              and(
                eq(teamMembers.teamId, teamId),
                eq(teamMembers.accessType, 'direct'),
                inArray(teamMembers.userId, upperSubordinateIds),
                sql`${teamMembers.userId} != ${managerId}`
              )
            );
        }
        
        console.log(`Other subordinates of ${upperManagerId} in team ${teamId}:`, otherSubordinatesInTeam.map(s => s.userId));
        
        // Check if upper manager is direct member themselves
        const isDirectMember = await db.select()
          .from(teamMembers)
          .where(
            and(
              eq(teamMembers.teamId, teamId),
              eq(teamMembers.userId, upperManagerId),
              eq(teamMembers.accessType, 'direct')
            )
          )
          .limit(1);
        
        console.log(`Upper manager ${upperManagerId} is direct member:`, isDirectMember.length > 0);
        
        // If NO other path AND NOT direct: remove upper manager's inherited access
        if (otherSubordinatesInTeam.length === 0 && isDirectMember.length === 0) {
          console.log(`Removing upper manager ${upperManagerId} from team ${teamId} (no other path)`);
          
          await db.delete(teamMembers).where(
            and(
              eq(teamMembers.teamId, teamId),
              eq(teamMembers.userId, upperManagerId),
              eq(teamMembers.grantedVia, managerId)
            )
          );
          
          results.push(`✓ Removed ${upperManagerId} from ${teamId} (no other path)`);
          
          // Recursively check the upper manager's managers
          await this.removeManagerFromTeamRecursively(upperManagerId, teamId, results);
        } else {
          console.log(`Upper manager ${upperManagerId} keeps access to team ${teamId} (has other path or is direct member)`);
        }
      }
    } catch (error) {
      console.error(`Error in removeManagerFromTeamRecursively for ${managerId}:`, error);
      throw error;
    }
  }

  /**
   * Action 5: Assign Resource to Team
   * Assigns resource to team + all team members (direct + manager) can now access it
   */
  static async assignResourceToTeam(teamId: string, resourceId: string, assignedBy?: string) {
    const results = [];
    
    // 1. Insert into team_resources
    await db.insert(teamResources).values({
      teamId,
      resourceId,
    });
    
    results.push(`✓ Assigned ${resourceId} to ${teamId}`);
    
    // 2. Query all team members (direct + manager access)
    const teamMembersList = await db.select()
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId));
    
    results.push(`  → ${teamMembersList.length} users can now access ${resourceId}:`);
    
    for (const member of teamMembersList) {
      const accessType = member.accessType === 'direct' ? 'direct member' : `manager via ${member.grantedVia}`;
      results.push(`    - ${member.userId} (${accessType})`);
    }
    
    return results;
  }

  /**
   * Action 6: Remove Resource from Team
   * Removes resource from team + members lose access unless they have it via another team
   */
  static async removeResourceFromTeam(teamId: string, resourceId: string) {
    const results = [];
    
    // 1. Delete from team_resources
    await db.delete(teamResources).where(
      and(
        eq(teamResources.teamId, teamId),
        eq(teamResources.resourceId, resourceId)
      )
    );
    
    results.push(`✓ Removed ${resourceId} from ${teamId}`);
    
    // 2. For each team member
    const teamMembersList = await db.select()
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId));
    
    for (const member of teamMembersList) {
      // Check if they have access via ANOTHER team
      const allResourceAssignments = await db.select()
        .from(teamResources)
        .where(eq(teamResources.resourceId, resourceId));
      
      const otherTeamAccess = allResourceAssignments.filter(
        assignment => assignment.teamId !== teamId
      );
      
      if (otherTeamAccess.length === 0) {
        results.push(`  → ${member.userId} lost access (no other path)`);
      } else {
        results.push(`  → ${member.userId} STILL has access (via other team) ✓`);
      }
    }
    
    return results;
  }

  // Helper methods
  private static async getUserManagersRecursive(userId: string, maxDepth: number): Promise<any[]> {
    const managers: any[] = [];
    const visited = new Set();
    
    const getDirectManagers = async (currentUserId: string, depth: number) => {
      if (depth >= maxDepth || visited.has(currentUserId)) return;
      
      visited.add(currentUserId);
      
      const directManagers = await db.select()
        .from(userManagers)
        .where(eq(userManagers.userId, currentUserId));
      
      for (const managerRel of directManagers) {
        const manager = await db.select()
          .from(users)
          .where(eq(users.id, managerRel.managerId))
          .limit(1);
        
        if (manager.length > 0) {
          managers.push(manager[0]);
          await getDirectManagers(managerRel.managerId, depth + 1);
        }
      }
    };
    
    await getDirectManagers(userId, 0);
    return managers;
  }

  private static async wouldCreateCycle(userId: string, managerId: string): Promise<boolean> {
    // Simple check: if manager is already managed by user
    const directCircular = await db.select()
      .from(userManagers)
      .where(
        and(
          eq(userManagers.userId, managerId),
          eq(userManagers.managerId, userId)
        )
      )
      .limit(1);
    
    return directCircular.length > 0;
  }

  private static async getManagementDepth(userId: string): Promise<number> {
    let depth = 0;
    let currentUserId = userId;
    const visited = new Set();
    
    while (depth < 5 && !visited.has(currentUserId)) { // Prevent infinite loops
      visited.add(currentUserId);
      
      const managers = await db.select()
        .from(userManagers)
        .where(eq(userManagers.userId, currentUserId))
        .limit(1);
      
      if (managers.length === 0) break;
      
      currentUserId = managers[0].managerId;
      depth++;
    }
    
    return depth;
  }
}
