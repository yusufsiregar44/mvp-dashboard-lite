import { Router } from 'express';
import { usersRouter } from './users.routes';
import { teamsRouter } from './teams.routes';
import { clientsRouter } from './clients.routes';

export const apiRouter = Router();

apiRouter.use('/users', usersRouter);
apiRouter.use('/teams', teamsRouter);
apiRouter.use('/clients', clientsRouter);


