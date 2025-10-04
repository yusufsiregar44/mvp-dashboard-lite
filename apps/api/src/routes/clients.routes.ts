import { Router } from 'express';
import { db } from '../db';
import { resources } from '../schema';
import { desc, eq } from 'drizzle-orm';
import { validateResource } from '../middleware/validation';
import { checkResourceExists } from '../middleware/businessRules';

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


