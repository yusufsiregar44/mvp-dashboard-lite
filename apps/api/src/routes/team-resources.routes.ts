import { Router } from 'express';
import { db } from '../db';
import { teamResources } from '../schema';
import { desc, eq, and } from 'drizzle-orm';
import { validateTeamResource } from '../middleware/validation';
import { 
  checkTeamExists, 
  checkResourceExists, 
  checkDuplicateTeamResource 
} from '../middleware/businessRules';
import { TeamService } from '../services/teamService';

export const teamResourcesRouter = Router();

teamResourcesRouter.get('/', async (_req, res) => {
  const items = await db.select().from(teamResources).orderBy(desc(teamResources.assignedAt));
  res.json(items);
});

teamResourcesRouter.post('/', 
  validateTeamResource, 
  checkTeamExists, 
  checkResourceExists, 
  checkDuplicateTeamResource, 
  async (req, res) => {
    try {
      const { teamId, resourceId } = req.body;
      
      // Use the core business logic
      const results = await TeamService.assignResourceToTeam(teamId, resourceId);
      
      res.status(201).json({ 
        success: true, 
        message: 'Resource assigned to team successfully',
        results 
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to assign resource to team' });
    }
  }
);

teamResourcesRouter.delete('/:teamId/:resourceId', 
  checkTeamExists, 
  checkResourceExists, 
  async (req, res) => {
    try {
      const { teamId, resourceId } = req.params;
      
      // Use the core business logic
      const results = await TeamService.removeResourceFromTeam(teamId, resourceId);
      
      res.status(200).json({ 
        success: true, 
        message: 'Resource removed from team successfully',
        results 
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to remove resource assignment' });
    }
  }
);

