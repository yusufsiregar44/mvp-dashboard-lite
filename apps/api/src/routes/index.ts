import { Router } from 'express';
import { usersRouter } from './users.routes';
import { teamsRouter } from './teams.routes';
import { clientsRouter } from './clients.routes';
import { userManagersRouter } from './user-managers.routes';
import { teamMembersRouter } from './team-members.routes';
import { teamResourcesRouter } from './team-resources.routes';
import { actionsRouter } from './actions.routes';

export const apiRouter = Router();

apiRouter.use('/users', usersRouter);
apiRouter.use('/teams', teamsRouter);
apiRouter.use('/clients', clientsRouter);
apiRouter.use('/user-managers', userManagersRouter);
apiRouter.use('/team-members', teamMembersRouter);
apiRouter.use('/team-resources', teamResourcesRouter);
apiRouter.use('/actions', actionsRouter);


