import { Router } from 'express';
import { db } from '../db';
import { users } from '../schema';
import { desc, eq } from 'drizzle-orm';
import { validateUser } from '../middleware/validation';
import { checkUserExists } from '../middleware/businessRules';

export const usersRouter = Router();

usersRouter.get('/', async (_req, res) => {
  const items = await db.select().from(users).orderBy(desc(users.createdAt));
  res.json({ items, total: items.length });
});
usersRouter.get('/:id', checkUserExists, async (req, res) => {
  res.json(req.user);
});

usersRouter.post('/', validateUser, async (req, res) => {
  try {
    const [created] = await db.insert(users).values(req.body).returning();
    res.status(201).json(created);
  } catch (error) {
    if ((error as any).code === '23505') { // Unique constraint violation
      res.status(409).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
});

usersRouter.put('/:id', checkUserExists, validateUser, async (req, res) => {
  try {
    const [updated] = await db.update(users).set(req.body).where(eq(users.id, req.params.id)).returning();
    res.json(updated);
  } catch (error) {
    if ((error as any).code === '23505') { // Unique constraint violation
      res.status(409).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
});

usersRouter.delete('/:id', checkUserExists, async (req, res) => {
  try {
    await db.delete(users).where(eq(users.id, req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});


