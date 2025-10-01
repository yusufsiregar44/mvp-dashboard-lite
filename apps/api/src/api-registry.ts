export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiEndpoint {
  method: HttpMethod;
  path: string;
  tag: 'users' | 'teams' | 'clients' | 'relationships' | 'auth';
  summary: string;
}

export const apiRegistry: ApiEndpoint[] = [
  { method: 'GET', path: '/users', tag: 'users', summary: 'List users' },
  { method: 'GET', path: '/users/:id', tag: 'users', summary: 'Get user by id' },
  { method: 'POST', path: '/users', tag: 'users', summary: 'Create user' },
  { method: 'PUT', path: '/users/:id', tag: 'users', summary: 'Update user' },
  { method: 'DELETE', path: '/users/:id', tag: 'users', summary: 'Delete user' },

  { method: 'GET', path: '/teams', tag: 'teams', summary: 'List teams' },
  { method: 'GET', path: '/teams/:id', tag: 'teams', summary: 'Get team by id' },
  { method: 'POST', path: '/teams', tag: 'teams', summary: 'Create team' },
  { method: 'PUT', path: '/teams/:id', tag: 'teams', summary: 'Update team' },
  { method: 'DELETE', path: '/teams/:id', tag: 'teams', summary: 'Delete team' },

  { method: 'GET', path: '/clients', tag: 'clients', summary: 'List clients' },
  { method: 'GET', path: '/clients/:id', tag: 'clients', summary: 'Get client by id' },
  { method: 'POST', path: '/clients', tag: 'clients', summary: 'Create client' },
  { method: 'PUT', path: '/clients/:id', tag: 'clients', summary: 'Update client' },
  { method: 'DELETE', path: '/clients/:id', tag: 'clients', summary: 'Delete client' },
];


