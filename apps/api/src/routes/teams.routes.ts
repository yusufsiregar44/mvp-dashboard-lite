import { Router } from 'express';
import { db } from '../db';
import { teams } from '../schema';
import { desc, eq } from 'drizzle-orm';
import { validateTeam } from '../middleware/validation';
import { checkTeamExists } from '../middleware/businessRules';

export const teamsRouter = Router();

teamsRouter.get('/', async (_req, res) => {
  const items = await db.select().from(teams).orderBy(desc(teams.createdAt));
  res.json({ items, total: items.length });
});
teamsRouter.get('/:id', checkTeamExists, async (req, res) => {
  res.json(req.team);
});

teamsRouter.post('/', validateTeam, async (req, res) => {
  try {
    const [created] = await db.insert(teams).values(req.body).returning();
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create team' });
  }
});

teamsRouter.put('/:id', checkTeamExists, validateTeam, async (req, res) => {
  try {
    const [updated] = await db.update(teams).set(req.body).where(eq(teams.id, req.params.id)).returning();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update team' });
  }
});

teamsRouter.delete('/:id', checkTeamExists, async (req, res) => {
  try {
    await db.delete(teams).where(eq(teams.id, req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete team' });
  }
});


