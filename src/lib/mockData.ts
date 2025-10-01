import { User, Team, Resource, UserManager, TeamMember, TeamResource } from '@/types';

// Users
export const users: User[] = [
  { id: '1', email: 'john.smith@bank.com', name: 'John Smith', role: 'Head of RM', createdAt: '2024-01-01' },
  { id: '2', email: 'sarah.jones@bank.com', name: 'Sarah Jones', role: 'Senior RM', createdAt: '2024-01-05' },
  { id: '3', email: 'mike.brown@bank.com', name: 'Mike Brown', role: 'Senior RM', createdAt: '2024-01-10' },
  { id: '4', email: 'emma.wilson@bank.com', name: 'Emma Wilson', role: 'RM', createdAt: '2024-02-01' },
  { id: '5', email: 'david.lee@bank.com', name: 'David Lee', role: 'RM', createdAt: '2024-02-05' },
  { id: '6', email: 'lisa.chen@bank.com', name: 'Lisa Chen', role: 'RM', createdAt: '2024-02-10' },
  { id: '7', email: 'tom.garcia@bank.com', name: 'Tom Garcia', role: 'RM', createdAt: '2024-02-15' },
  { id: '8', email: 'anna.white@bank.com', name: 'Anna White', role: 'Senior RM', createdAt: '2024-02-20' },
];

// Teams
export const teams: Team[] = [
  { id: 't1', name: 'Private Banking - APAC', autoAssignClients: true, createdAt: '2024-01-01' },
  { id: 't2', name: 'Corporate Banking - Tech', autoAssignClients: false, createdAt: '2024-01-05' },
  { id: 't3', name: 'Retail Banking - North', autoAssignClients: true, createdAt: '2024-01-10' },
  { id: 't4', name: 'Wealth Management - HNW', autoAssignClients: false, createdAt: '2024-01-15' },
  { id: 't5', name: 'Investment Banking', autoAssignClients: false, createdAt: '2024-01-20' },
];

// Resources (Clients)
export const resources: Resource[] = [
  { id: 'c1', name: 'Acme Corporation', type: 'client', segment: 'Corporate', createdAt: '2024-01-01' },
  { id: 'c2', name: 'Smith Family Trust', type: 'client', segment: 'Private', createdAt: '2024-01-05' },
  { id: 'c3', name: 'TechStart Inc.', type: 'client', segment: 'Corporate', createdAt: '2024-01-10' },
  { id: 'c4', name: 'Johnson Holdings', type: 'client', segment: 'Private', createdAt: '2024-01-15' },
  { id: 'c5', name: 'Global Retail Ltd', type: 'client', segment: 'Retail', createdAt: '2024-01-20' },
  { id: 'c6', name: 'Anderson Wealth', type: 'client', segment: 'Private', createdAt: '2024-01-25' },
  { id: 'c7', name: 'Metro Bank Partners', type: 'client', segment: 'Corporate', createdAt: '2024-02-01' },
  { id: 'c8', name: 'Legacy Investments', type: 'client', segment: 'Private', createdAt: '2024-02-05' },
  { id: 'c9', name: 'Sunrise Ventures', type: 'client', segment: 'Corporate', createdAt: '2024-02-10' },
  { id: 'c10', name: 'Martinez Family Office', type: 'client', segment: 'Private', createdAt: '2024-02-15' },
];

// User Managers (hierarchy)
export const userManagers: UserManager[] = [
  // John (Head) manages Sarah and Mike (Senior RMs)
  { userId: '2', managerId: '1', managerType: 'line_manager', createdAt: '2024-01-05' },
  { userId: '3', managerId: '1', managerType: 'line_manager', createdAt: '2024-01-10' },
  
  // Sarah manages Emma and David
  { userId: '4', managerId: '2', managerType: 'line_manager', createdAt: '2024-02-01' },
  { userId: '5', managerId: '2', managerType: 'line_manager', createdAt: '2024-02-05' },
  
  // Mike manages Lisa and Tom
  { userId: '6', managerId: '3', managerType: 'line_manager', createdAt: '2024-02-10' },
  { userId: '7', managerId: '3', managerType: 'line_manager', createdAt: '2024-02-15' },
  
  // Anna (Senior RM) manages some RMs and reports to John
  { userId: '8', managerId: '1', managerType: 'line_manager', createdAt: '2024-02-20' },
];

// Team Members
export const teamMembers: TeamMember[] = [
  // Team 1 (Private Banking - APAC)
  { teamId: 't1', userId: '2', accessType: 'direct', grantedVia: null, joinedAt: '2024-01-05' },
  { teamId: 't1', userId: '1', accessType: 'manager', grantedVia: '2', joinedAt: '2024-01-05' }, // John via Sarah
  { teamId: 't1', userId: '4', accessType: 'direct', grantedVia: null, joinedAt: '2024-02-01' },
  { teamId: 't1', userId: '2', accessType: 'manager', grantedVia: '4', joinedAt: '2024-02-01' }, // Sarah via Emma
  
  // Team 2 (Corporate Banking - Tech)
  { teamId: 't2', userId: '3', accessType: 'direct', grantedVia: null, joinedAt: '2024-01-10' },
  { teamId: 't2', userId: '1', accessType: 'manager', grantedVia: '3', joinedAt: '2024-01-10' }, // John via Mike
  { teamId: 't2', userId: '6', accessType: 'direct', grantedVia: null, joinedAt: '2024-02-10' },
  { teamId: 't2', userId: '3', accessType: 'manager', grantedVia: '6', joinedAt: '2024-02-10' }, // Mike via Lisa
  
  // Team 3 (Retail Banking - North)
  { teamId: 't3', userId: '5', accessType: 'direct', grantedVia: null, joinedAt: '2024-02-05' },
  { teamId: 't3', userId: '2', accessType: 'manager', grantedVia: '5', joinedAt: '2024-02-05' }, // Sarah via David
  { teamId: 't3', userId: '1', accessType: 'manager', grantedVia: '5', joinedAt: '2024-02-05' }, // John via David
  
  // Team 4 (Wealth Management - HNW)
  { teamId: 't4', userId: '8', accessType: 'direct', grantedVia: null, joinedAt: '2024-02-20' },
  { teamId: 't4', userId: '1', accessType: 'manager', grantedVia: '8', joinedAt: '2024-02-20' }, // John via Anna
  { teamId: 't4', userId: '7', accessType: 'direct', grantedVia: null, joinedAt: '2024-02-25' },
  { teamId: 't4', userId: '3', accessType: 'manager', grantedVia: '7', joinedAt: '2024-02-25' }, // Mike via Tom
  
  // Team 5 (Investment Banking)
  { teamId: 't5', userId: '1', accessType: 'direct', grantedVia: null, joinedAt: '2024-01-20' },
];

// Team Resources (Client assignments)
export const teamResources: TeamResource[] = [
  // Team 1 clients
  { teamId: 't1', resourceId: 'c2', assignedAt: '2024-01-10' },
  { teamId: 't1', resourceId: 'c4', assignedAt: '2024-01-15' },
  { teamId: 't1', resourceId: 'c6', assignedAt: '2024-01-25' },
  
  // Team 2 clients
  { teamId: 't2', resourceId: 'c1', assignedAt: '2024-01-12' },
  { teamId: 't2', resourceId: 'c3', assignedAt: '2024-01-18' },
  { teamId: 't2', resourceId: 'c7', assignedAt: '2024-02-01' },
  { teamId: 't2', resourceId: 'c9', assignedAt: '2024-02-10' },
  
  // Team 3 clients
  { teamId: 't3', resourceId: 'c5', assignedAt: '2024-01-22' },
  
  // Team 4 clients
  { teamId: 't4', resourceId: 'c8', assignedAt: '2024-02-05' },
  { teamId: 't4', resourceId: 'c10', assignedAt: '2024-02-15' },
  { teamId: 't4', resourceId: 'c2', assignedAt: '2024-02-20' }, // Client in multiple teams
  
  // Team 5 clients
  { teamId: 't5', resourceId: 'c1', assignedAt: '2024-01-25' }, // Client in multiple teams
  { teamId: 't5', resourceId: 'c7', assignedAt: '2024-02-05' }, // Client in multiple teams
];