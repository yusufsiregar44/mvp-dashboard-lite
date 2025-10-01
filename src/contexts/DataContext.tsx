import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Team, Resource, UserManager, TeamMember, TeamResource } from '@/types';
import * as mockData from '@/lib/mockData';

interface DataContextType {
  users: User[];
  teams: Team[];
  resources: Resource[];
  userManagers: UserManager[];
  teamMembers: TeamMember[];
  teamResources: TeamResource[];
  addUser: (user: User) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  addTeam: (team: Team) => void;
  updateTeam: (id: string, team: Partial<Team>) => void;
  deleteTeam: (id: string) => void;
  addResource: (resource: Resource) => void;
  updateResource: (id: string, resource: Partial<Resource>) => void;
  deleteResource: (id: string) => void;
  addUserManager: (relation: UserManager) => void;
  removeUserManager: (userId: string, managerId: string) => void;
  addTeamMember: (member: TeamMember) => void;
  removeTeamMember: (teamId: string, userId: string) => void;
  addTeamResource: (assignment: TeamResource) => void;
  removeTeamResource: (teamId: string, resourceId: string) => void;
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

  // Load from localStorage or use mock data
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      setUsers(data.users || mockData.users);
      setTeams(data.teams || mockData.teams);
      setResources(data.resources || mockData.resources);
      setUserManagers(data.userManagers || mockData.userManagers);
      setTeamMembers(data.teamMembers || mockData.teamMembers);
      setTeamResources(data.teamResources || mockData.teamResources);
    } else {
      setUsers(mockData.users);
      setTeams(mockData.teams);
      setResources(mockData.resources);
      setUserManagers(mockData.userManagers);
      setTeamMembers(mockData.teamMembers);
      setTeamResources(mockData.teamResources);
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      users,
      teams,
      resources,
      userManagers,
      teamMembers,
      teamResources,
    }));
  }, [users, teams, resources, userManagers, teamMembers, teamResources]);

  const addUser = (user: User) => setUsers(prev => [...prev, user]);
  const updateUser = (id: string, updates: Partial<User>) => 
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    setUserManagers(prev => prev.filter(um => um.userId !== id && um.managerId !== id));
    setTeamMembers(prev => prev.filter(tm => tm.userId !== id));
  };

  const addTeam = (team: Team) => setTeams(prev => [...prev, team]);
  const updateTeam = (id: string, updates: Partial<Team>) => 
    setTeams(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  const deleteTeam = (id: string) => {
    setTeams(prev => prev.filter(t => t.id !== id));
    setTeamMembers(prev => prev.filter(tm => tm.teamId !== id));
    setTeamResources(prev => prev.filter(tr => tr.teamId !== id));
  };

  const addResource = (resource: Resource) => setResources(prev => [...prev, resource]);
  const updateResource = (id: string, updates: Partial<Resource>) => 
    setResources(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  const deleteResource = (id: string) => {
    setResources(prev => prev.filter(r => r.id !== id));
    setTeamResources(prev => prev.filter(tr => tr.resourceId !== id));
  };

  const addUserManager = (relation: UserManager) => setUserManagers(prev => [...prev, relation]);
  const removeUserManager = (userId: string, managerId: string) => 
    setUserManagers(prev => prev.filter(um => !(um.userId === userId && um.managerId === managerId)));

  const addTeamMember = (member: TeamMember) => setTeamMembers(prev => [...prev, member]);
  const removeTeamMember = (teamId: string, userId: string) => 
    setTeamMembers(prev => prev.filter(tm => !(tm.teamId === teamId && tm.userId === userId)));

  const addTeamResource = (assignment: TeamResource) => setTeamResources(prev => [...prev, assignment]);
  const removeTeamResource = (teamId: string, resourceId: string) => 
    setTeamResources(prev => prev.filter(tr => !(tr.teamId === teamId && tr.resourceId === resourceId)));

  return (
    <DataContext.Provider value={{
      users,
      teams,
      resources,
      userManagers,
      teamMembers,
      teamResources,
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
      addTeamMember,
      removeTeamMember,
      addTeamResource,
      removeTeamResource,
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