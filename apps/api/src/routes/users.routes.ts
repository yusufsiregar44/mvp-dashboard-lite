import { Router } from 'express';

export const usersRouter = Router();

usersRouter.get('/', (_req, res) => res.json({ items: [], total: 0 }));
usersRouter.get('/:id', (req, res) => res.json({ id: req.params.id }));
usersRouter.post('/', (_req, res) => res.status(201).json({}));
usersRouter.put('/:id', (req, res) => res.json({ id: req.params.id }));
usersRouter.delete('/:id', (_req, res) => res.status(204).send());


