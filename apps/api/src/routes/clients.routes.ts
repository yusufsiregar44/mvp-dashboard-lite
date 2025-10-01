import { Router } from 'express';

export const clientsRouter = Router();

clientsRouter.get('/', (_req, res) => res.json({ items: [], total: 0 }));
clientsRouter.get('/:id', (req, res) => res.json({ id: req.params.id }));
clientsRouter.post('/', (_req, res) => res.status(201).json({}));
clientsRouter.put('/:id', (req, res) => res.json({ id: req.params.id }));
clientsRouter.delete('/:id', (_req, res) => res.status(204).send());


