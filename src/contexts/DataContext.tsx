import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Team, Resource, UserManager, TeamMember, TeamResource } from '@/types';
import { apiService } from '@/lib/api';
import * as mockData from '@/lib/mockData';

interface DataContextType {
  users: User[];
  teams: Team[];
  resources: Resource[];
  userManagers: UserManager[];
  teamMembers: TeamMember[];
  teamResources: TeamResource[];
  loading: boolean;
  error: string | null;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addTeam: (team: Team) => Promise<void>;
  updateTeam: (id: string, team: Partial<Team>) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;
  addResource: (resource: Resource) => Promise<void>;
  updateResource: (id: string, resource: Partial<Resource>) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;
  addUserManager: (relation: UserManager) => Promise<void>;
  removeUserManager: (userId: string, managerId: string) => Promise<void>;
  // Key Action 3: Assign Manager (with automatic team inheritance)
  assignManager: (userId: string, managerId: string) => Promise<void>;
  // Key Action 4: Remove Manager (with access recalculation)
  removeManager: (userId: string, managerId: string) => Promise<void>;
  addTeamMember: (member: TeamMember) => Promise<void>;
  removeTeamMember: (teamId: string, userId: string) => Promise<void>;
  // Key Action 1: Add User to Team (with automatic manager inheritance)
  addUserToTeam: (userId: string, teamId: string) => Promise<void>;
  // Key Action 2: Remove User from Team (with cleanup logic)
  removeUserFromTeam: (userId: string, teamId: string) => Promise<void>;
  addTeamResource: (assignment: TeamResource) => Promise<void>;
  removeTeamResource: (teamId: string, resourceId: string) => Promise<void>;
  // Action 5 & 6: Team-Resource Assignment methods
  assignResourceToTeam: (resourceId: string, teamId: string) => Promise<void>;
  removeResourceFromTeam: (resourceId: string, teamId: string) => Promise<void>;
  getResourceTeams: (resourceId: string) => Promise<TeamResource[]>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEY = 'team-mgmt-data';

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [userManagers, setUserManagers] = useState<UserManager[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamResources, setTeamResources] = useState<TeamResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data from API
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load all data in parallel
      const [usersRes, teamsRes, resourcesRes, userManagersRes, teamMembersRes, teamResourcesRes] = await Promise.all([
        apiService.getUsers(),
        apiService.getTeams(),
        apiService.getClients(),
        apiService.getUserManagers(),
        apiService.getTeamMembers(),
        apiService.getTeamResources(),
      ]);

      if (usersRes.error) throw new Error(usersRes.error);
      if (teamsRes.error) throw new Error(teamsRes.error);
      if (resourcesRes.error) throw new Error(resourcesRes.error);
      if (userManagersRes.error) throw new Error(userManagersRes.error);
      if (teamMembersRes.error) throw new Error(teamMembersRes.error);
      if (teamResourcesRes.error) throw new Error(teamResourcesRes.error);

      setUsers(usersRes.data?.items || []);
      setTeams(teamsRes.data?.items || []);
      setResources(resourcesRes.data?.items || []);
      setUserManagers(userManagersRes.data || []);
      setTeamMembers(teamMembersRes.data || []);
      setTeamResources(teamResourcesRes.data || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      
      // Fallback to mock data
      setUsers(mockData.users);
      setTeams(mockData.teams);
      setResources(mockData.resources);
      setUserManagers(mockData.userManagers);
      setTeamMembers(mockData.teamMembers);
      setTeamResources(mockData.teamResources);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // User CRUD operations
  const addUser = async (user: Omit<User, 'id' | 'createdAt'>) => {
    const result = await apiService.createUser(user);
    if (result.error) {
      setError(result.error);
      throw new Error(result.error);
    }
    setUsers(prev => [...prev, result.data!]);
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    const result = await apiService.updateUser(id, updates);
    if (result.error) {
      setError(result.error);
      return;
    }
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  };

  const deleteUser = async (id: string) => {
    const result = await apiService.deleteUser(id);
    if (result.error) {
      setError(result.error);
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== id));
    setUserManagers(prev => prev.filter(um => um.userId !== id && um.managerId !== id));
    setTeamMembers(prev => prev.filter(tm => tm.userId !== id));
  };

  // Team CRUD operations
  const addTeam = async (team: Team) => {
    const result = await apiService.createTeam(team);
    if (result.error) {
      setError(result.error);
      return;
    }
    setTeams(prev => [...prev, result.data!]);
  };

  const updateTeam = async (id: string, updates: Partial<Team>) => {
    const result = await apiService.updateTeam(id, updates);
    if (result.error) {
      setError(result.error);
      return;
    }
    setTeams(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTeam = async (id: string) => {
    const result = await apiService.deleteTeam(id);
    if (result.error) {
      setError(result.error);
      return;
    }
    setTeams(prev => prev.filter(t => t.id !== id));
    setTeamMembers(prev => prev.filter(tm => tm.teamId !== id));
    setTeamResources(prev => prev.filter(tr => tr.teamId !== id));
  };

  // Resource CRUD operations
  const addResource = async (resource: Resource) => {
    const result = await apiService.createClient(resource);
    if (result.error) {
      setError(result.error);
      return;
    }
    setResources(prev => [...prev, result.data!]);
  };

  const updateResource = async (id: string, updates: Partial<Resource>) => {
    const result = await apiService.updateClient(id, updates);
    if (result.error) {
      setError(result.error);
      return;
    }
    setResources(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteResource = async (id: string) => {
    const result = await apiService.deleteClient(id);
    if (result.error) {
      setError(result.error);
      return;
    }
    setResources(prev => prev.filter(r => r.id !== id));
    setTeamResources(prev => prev.filter(tr => tr.resourceId !== id));
  };

  // Relationship operations
  const addUserManager = async (relation: UserManager) => {
    const result = await apiService.createUserManager(relation);
    if (result.error) {
      setError(result.error);
      return;
    }
    setUserManagers(prev => [...prev, result.data!]);
  };

  const removeUserManager = async (userId: string, managerId: string) => {
    const result = await apiService.deleteUserManager(userId, managerId);
    if (result.error) {
      setError(result.error);
      return;
    }
    setUserManagers(prev => prev.filter(um => !(um.userId === userId && um.managerId === managerId)));
  };

  // Key Action 3: Assign Manager (with automatic team inheritance)
  const assignManager = async (userId: string, managerId: string) => {
    const result = await apiService.assignManager(userId, managerId);
    if (result.error) {
      setError(result.error);
      throw new Error(result.error);
    }
    // Refresh data to get updated team memberships and manager relationships
    await refreshData();
  };

  // Key Action 4: Remove Manager (with access recalculation)
  const removeManager = async (userId: string, managerId: string) => {
    const result = await apiService.removeManager(userId, managerId);
    if (result.error) {
      setError(result.error);
      throw new Error(result.error);
    }
    // Refresh data to reflect team access changes
    await refreshData();
  };

  const addTeamMember = async (member: TeamMember) => {
    const result = await apiService.createTeamMember(member);
    if (result.error) {
      setError(result.error);
      return;
    }
    setTeamMembers(prev => [...prev, result.data!]);
  };

  const removeTeamMember = async (teamId: string, userId: string) => {
    const result = await apiService.deleteTeamMember(teamId, userId);
    if (result.error) {
      setError(result.error);
      return;
    }
    setTeamMembers(prev => prev.filter(tm => !(tm.teamId === teamId && tm.userId === userId)));
  };

  // Key Action 1: Add User to Team (with automatic manager inheritance)
  const addUserToTeam = async (userId: string, teamId: string) => {
    const result = await apiService.addUserToTeam(userId, teamId);
    if (result.error) {
      setError(result.error);
      throw new Error(result.error);
    }
    // Refresh team members data to get the updated memberships including managers
    await refreshData();
  };

  // Key Action 2: Remove User from Team (with cleanup logic)
  const removeUserFromTeam = async (userId: string, teamId: string) => {
    const result = await apiService.removeUserFromTeam(userId, teamId);
    if (result.error) {
      setError(result.error);
      throw new Error(result.error);
    }
    // Refresh team members data to reflect the cleanup
    await refreshData();
  };

  const addTeamResource = async (assignment: TeamResource) => {
    const result = await apiService.createTeamResource(assignment);
    if (result.error) {
      setError(result.error);
      return;
    }
    setTeamResources(prev => [...prev, result.data!]);
  };

  const removeTeamResource = async (teamId: string, resourceId: string) => {
    const result = await apiService.deleteTeamResource(teamId, resourceId);
    if (result.error) {
      setError(result.error);
      return;
    }
    setTeamResources(prev => prev.filter(tr => !(tr.teamId === teamId && tr.resourceId === resourceId)));
  };

  // Action 5: Assign Resource to Team
  const assignResourceToTeam = async (resourceId: string, teamId: string) => {
    const result = await apiService.assignClientToTeam(resourceId, teamId);
    if (result.error) {
      setError(result.error);
      return;
    }
    // Add the new team-resource assignment to local state
    const newAssignment: TeamResource = {
      teamId,
      resourceId,
      assignedAt: new Date().toISOString(),
    };
    setTeamResources(prev => [...prev, newAssignment]);
  };

  // Action 6: Remove Resource from Team
  const removeResourceFromTeam = async (resourceId: string, teamId: string) => {
    const result = await apiService.removeClientFromTeam(resourceId, teamId);
    if (result.error) {
      setError(result.error);
      return;
    }
    // Remove the team-resource assignment from local state
    setTeamResources(prev => prev.filter(tr => !(tr.teamId === teamId && tr.resourceId === resourceId)));
  };

  // Get teams that have access to a specific resource
  const getResourceTeams = async (resourceId: string): Promise<TeamResource[]> => {
    const result = await apiService.getClientTeams(resourceId);
    if (result.error) {
      setError(result.error);
      return [];
    }
    return result.data?.teams || [];
  };

  const refreshData = async () => {
    await loadData();
  };

  return (
    <DataContext.Provider value={{
      users,
      teams,
      resources,
      userManagers,
      teamMembers,
      teamResources,
      loading,
      error,
      addUser,
      updateUser,
      deleteUser,
      addTeam,
      updateTeam,
      deleteTeam,
      addResource,
      updateResource,
      deleteResource,
      addUserManager,
      removeUserManager,
      assignManager,
      removeManager,
      addTeamMember,
      removeTeamMember,
      addUserToTeam,
      removeUserFromTeam,
      addTeamResource,
      removeTeamResource,
      assignResourceToTeam,
      removeResourceFromTeam,
      getResourceTeams,
      refreshData,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};