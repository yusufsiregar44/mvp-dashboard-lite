import { Router } from 'express';
import { db } from '../db';
import { teamMembers } from '../schema';
import { desc, eq, and } from 'drizzle-orm';
import { validateTeamMember } from '../middleware/validation';
import { 
  checkTeamExists, 
  checkUserExists, 
  checkDuplicateTeamMembership, 
  validateManagerAccess 
} from '../middleware/businessRules';
import { TeamService } from '../services/teamService';

export const teamMembersRouter = Router();

teamMembersRouter.get('/', async (_req, res) => {
  const items = await db.select().from(teamMembers).orderBy(desc(teamMembers.joinedAt));
  res.json(items);
});

teamMembersRouter.post('/', 
  validateTeamMember, 
  checkTeamExists, 
  checkUserExists, 
  checkDuplicateTeamMembership, 
  validateManagerAccess, 
  async (req, res) => {
    try {
      const { teamId, userId } = req.body;
      
      // Use the core business logic
      const results = await TeamService.addUserToTeam(userId, teamId);
      
      res.status(201).json({ 
        success: true, 
        message: 'User added to team successfully',
        results 
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add team member' });
    }
  }
);

teamMembersRouter.delete('/:teamId/:userId', 
  checkTeamExists, 
  checkUserExists, 
  async (req, res) => {
    try {
      const { teamId, userId } = req.params;
      
      // Use the core business logic
      const results = await TeamService.removeUserFromTeam(userId, teamId);
      
      res.status(200).json({ 
        success: true, 
        message: 'User removed from team successfully',
        results 
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to remove team member' });
    }
  }
);

