import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users, userManagers, teamMembers, teams, resources, teamResources } from '../schema';
import { eq, and } from 'drizzle-orm';

export const checkUserExists = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.params || req.body;
  
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const checkTeamExists = async (req: Request, res: Response, next: NextFunction) => {
  const { teamId } = req.params;
  
  try {
    const [team] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    req.team = team;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const checkResourceExists = async (req: Request, res: Response, next: NextFunction) => {
  const { resourceId } = req.params;
  
  try {
    const [resource] = await db.select().from(resources).where(eq(resources.id, resourceId)).limit(1);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    req.resource = resource;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const checkManagerExists = async (req: Request, res: Response, next: NextFunction) => {
  const { managerId } = req.params || req.body;
  
  try {
    const [manager] = await db.select().from(users).where(eq(users.id, managerId)).limit(1);
    if (!manager) {
      return res.status(404).json({ error: 'Manager not found' });
    }
    req.manager = manager;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const preventCircularManagerRelationship = async (req: Request, res: Response, next: NextFunction) => {
  const { userId, managerId } = req.params || req.body;
  
  try {
    // Check if the manager is already managed by the user (direct or indirect)
    const isCircular = await checkCircularRelationship(userId, managerId);
    if (isCircular) {
      return res.status(400).json({ 
        error: 'Circular manager relationship detected',
        message: 'This would create a circular management hierarchy'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const checkDuplicateManagerRelationship = async (req: Request, res: Response, next: NextFunction) => {
  const { userId, managerId } = req.params || req.body;
  
  try {
    const [existing] = await db.select()
      .from(userManagers)
      .where(
        and(
          eq(userManagers.userId, userId),
          eq(userManagers.managerId, managerId)
        )
      )
      .limit(1);
    
    if (existing) {
      return res.status(409).json({ 
        error: 'Duplicate manager relationship',
        message: 'This manager relationship already exists'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const checkDuplicateTeamMembership = async (req: Request, res: Response, next: NextFunction) => {
  const { teamId, userId } = req.body;
  
  try {
    const [existing] = await db.select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, userId)
        )
      )
      .limit(1);
    
    if (existing) {
      return res.status(409).json({ 
        error: 'Duplicate team membership',
        message: 'User is already a member of this team'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const checkDuplicateTeamResource = async (req: Request, res: Response, next: NextFunction) => {
  const { teamId, resourceId } = req.body;
  
  try {
    const [existing] = await db.select()
      .from(teamResources)
      .where(
        and(
          eq(teamResources.teamId, teamId),
          eq(teamResources.resourceId, resourceId)
        )
      )
      .limit(1);
    
    if (existing) {
      return res.status(409).json({ 
        error: 'Duplicate team resource assignment',
        message: 'Resource is already assigned to this team'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const validateManagerAccess = async (req: Request, res: Response, next: NextFunction) => {
  const { teamId, grantedVia } = req.body;
  
  if (!grantedVia) {
    return next();
  }
  
  try {
    // Check if the granting user is a direct member of the team
    const [grantor] = await db.select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, grantedVia),
          eq(teamMembers.accessType, 'direct')
        )
      )
      .limit(1);
    
    if (!grantor) {
      return res.status(400).json({ 
        error: 'Invalid grantor',
        message: 'Granting user must be a direct member of the team'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

// Helper function to check for circular relationships
async function checkCircularRelationship(userId: string, managerId: string): Promise<boolean> {
  // Simple check: if manager is already managed by user
  const [directCircular] = await db.select()
    .from(userManagers)
    .where(
      and(
        eq(userManagers.userId, managerId),
        eq(userManagers.managerId, userId)
      )
    )
    .limit(1);
  
  if (directCircular) {
    return true;
  }
  
  // TODO: Implement more sophisticated circular relationship detection
  // This would require recursive traversal of the management hierarchy
  return false;
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: any;
      team?: any;
      resource?: any;
      manager?: any;
    }
  }
}

