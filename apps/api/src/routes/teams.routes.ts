import { Router } from 'express';

export const teamsRouter = Router();

teamsRouter.get('/', (_req, res) => res.json({ items: [], total: 0 }));
teamsRouter.get('/:id', (req, res) => res.json({ id: req.params.id }));
teamsRouter.post('/', (_req, res) => res.status(201).json({}));
teamsRouter.put('/:id', (req, res) => res.json({ id: req.params.id }));
teamsRouter.delete('/:id', (_req, res) => res.status(204).send());


