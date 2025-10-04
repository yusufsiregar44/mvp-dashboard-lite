import { Router } from 'express';
import { db } from '../db';
import { resources, teamResources } from '../schema';
import { desc, eq } from 'drizzle-orm';
import { validateResource } from '../middleware/validation';
import { checkResourceExists } from '../middleware/businessRules';
import { TeamService } from '../services/teamService';

export const clientsRouter = Router();

clientsRouter.get('/', async (_req, res) => {
  const items = await db.select().from(resources).orderBy(desc(resources.createdAt));
  res.json({ items, total: items.length });
});
clientsRouter.get('/:id', checkResourceExists, async (req, res) => {
  res.json(req.resource);
});

clientsRouter.post('/', validateResource, async (req, res) => {
  try {
    const [created] = await db.insert(resources).values(req.body).returning();
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create client' });
  }
});

clientsRouter.put('/:id', checkResourceExists, validateResource, async (req, res) => {
  try {
    const [updated] = await db.update(resources).set(req.body).where(eq(resources.id, req.params.id)).returning();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update client' });
  }
});

clientsRouter.delete('/:id', checkResourceExists, async (req, res) => {
  try {
    await db.delete(resources).where(eq(resources.id, req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

// Action 5: Assign Resource to Team
clientsRouter.post('/:id/assign-to-team', checkResourceExists, async (req, res) => {
  try {
    const { teamId } = req.body;
    const { id: resourceId } = req.params;
    
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }
    
    const results = await TeamService.assignResourceToTeam(teamId, resourceId);
    res.status(200).json({ 
      message: 'Resource assigned to team successfully',
      results 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign resource to team' });
  }
});

// Action 6: Remove Resource from Team
clientsRouter.delete('/:id/remove-from-team', checkResourceExists, async (req, res) => {
  try {
    const { teamId } = req.body;
    const { id: resourceId } = req.params;
    
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }
    
    const results = await TeamService.removeResourceFromTeam(teamId, resourceId);
    res.status(200).json({ 
      message: 'Resource removed from team successfully',
      results 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove resource from team' });
  }
});

// Get teams that have access to a specific resource
clientsRouter.get('/:id/teams', checkResourceExists, async (req, res) => {
  try {
    const { id: resourceId } = req.params;
    
    const assignedTeams = await db.select()
      .from(teamResources)
      .where(eq(teamResources.resourceId, resourceId));
    
    res.json({ teams: assignedTeams });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get teams for resource' });
  }
});


