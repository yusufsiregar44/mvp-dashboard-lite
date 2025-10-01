export type UserRole = 'RM' | 'Senior RM' | 'Head of RM';

export type ManagerType = 'line_manager' | 'functional' | 'dotted_line';

export type AccessType = 'direct' | 'manager';

export type ResourceSegment = 'Private' | 'Corporate' | 'Retail';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  autoAssignClients: boolean;
  createdAt: string;
}

export interface Resource {
  id: string;
  name: string;
  type: string;
  segment: ResourceSegment;
  createdAt: string;
}

export interface UserManager {
  userId: string;
  managerId: string;
  managerType: ManagerType;
  createdAt: string;
}

export interface TeamMember {
  teamId: string;
  userId: string;
  accessType: AccessType;
  grantedVia: string | null;
  joinedAt: string;
}

export interface TeamResource {
  teamId: string;
  resourceId: string;
  assignedAt: string;
}

export interface ClientAccessInfo {
  resource: Resource;
  teams: Array<{
    team: Team;
    members: Array<{
      user: User;
      accessType: AccessType;
      grantedVia?: User;
    }>;
  }>;
  totalUsers: number;
}