// API service layer for frontend-backend communication
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

class ApiService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          error: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Users API
  async getUsers(): Promise<ApiResponse<PaginatedResponse<any>>> {
    return this.request<PaginatedResponse<any>>('/users');
  }

  async getUser(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/users/${id}`);
  }

  async createUser(user: any): Promise<ApiResponse<any>> {
    return this.request<any>('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  async updateUser(id: string, user: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Teams API
  async getTeams(): Promise<ApiResponse<PaginatedResponse<any>>> {
    return this.request<PaginatedResponse<any>>('/teams');
  }

  async getTeam(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/teams/${id}`);
  }

  async createTeam(team: any): Promise<ApiResponse<any>> {
    return this.request<any>('/teams', {
      method: 'POST',
      body: JSON.stringify(team),
    });
  }

  async updateTeam(id: string, team: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(team),
    });
  }

  async deleteTeam(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/teams/${id}`, {
      method: 'DELETE',
    });
  }

  // Clients (Resources) API
  async getClients(): Promise<ApiResponse<PaginatedResponse<any>>> {
    return this.request<PaginatedResponse<any>>('/clients');
  }

  async getClient(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/clients/${id}`);
  }

  async createClient(client: any): Promise<ApiResponse<any>> {
    return this.request<any>('/clients', {
      method: 'POST',
      body: JSON.stringify(client),
    });
  }

  async updateClient(id: string, client: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(client),
    });
  }

  async deleteClient(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/clients/${id}`, {
      method: 'DELETE',
    });
  }

  // Action 5 & 6: Team-Resource Assignment APIs
  async assignClientToTeam(clientId: string, teamId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/clients/${clientId}/assign-to-team`, {
      method: 'POST',
      body: JSON.stringify({ teamId }),
    });
  }

  async removeClientFromTeam(clientId: string, teamId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/clients/${clientId}/remove-from-team`, {
      method: 'DELETE',
      body: JSON.stringify({ teamId }),
    });
  }

  async getClientTeams(clientId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/clients/${clientId}/teams`);
  }

  // Relationship APIs (to be implemented)
  async getUserManagers(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/user-managers');
  }

  async createUserManager(relation: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/user-managers/${relation.userId}/${relation.managerId}`, {
      method: 'POST',
    });
  }

  async deleteUserManager(userId: string, managerId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/user-managers/${userId}/${managerId}`, {
      method: 'DELETE',
    });
  }

  async getTeamMembers(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/team-members');
  }

  async createTeamMember(member: any): Promise<ApiResponse<any>> {
    return this.request<any>('/team-members', {
      method: 'POST',
      body: JSON.stringify(member),
    });
  }

  async deleteTeamMember(teamId: string, userId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/team-members/${teamId}/${userId}`, {
      method: 'DELETE',
    });
  }

  async getTeamResources(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/team-resources');
  }

  async createTeamResource(assignment: any): Promise<ApiResponse<any>> {
    return this.request<any>('/team-resources', {
      method: 'POST',
      body: JSON.stringify(assignment),
    });
  }

  async deleteTeamResource(teamId: string, resourceId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/team-resources/${teamId}/${resourceId}`, {
      method: 'DELETE',
    });
  }

  // Key Actions API endpoints
  async addUserToTeam(userId: string, teamId: string): Promise<ApiResponse<any>> {
    return this.request<any>('/actions/add-user-to-team', {
      method: 'POST',
      body: JSON.stringify({ userId, teamId }),
    });
  }

  async removeUserFromTeam(userId: string, teamId: string): Promise<ApiResponse<any>> {
    return this.request<any>('/actions/remove-user-from-team', {
      method: 'POST',
      body: JSON.stringify({ userId, teamId }),
    });
  }

  async assignManager(userId: string, managerId: string): Promise<ApiResponse<any>> {
    return this.request<any>('/actions/assign-manager', {
      method: 'POST',
      body: JSON.stringify({ userId, managerId }),
    });
  }

  async removeManager(userId: string, managerId: string): Promise<ApiResponse<any>> {
    return this.request<any>('/actions/remove-manager', {
      method: 'POST',
      body: JSON.stringify({ userId, managerId }),
    });
  }

  async assignResourceToTeam(teamId: string, resourceId: string): Promise<ApiResponse<any>> {
    return this.request<any>('/actions/assign-resource-to-team', {
      method: 'POST',
      body: JSON.stringify({ teamId, resourceId }),
    });
  }

  async removeResourceFromTeam(teamId: string, resourceId: string): Promise<ApiResponse<any>> {
    return this.request<any>('/actions/remove-resource-from-team', {
      method: 'POST',
      body: JSON.stringify({ teamId, resourceId }),
    });
  }
}

export const apiService = new ApiService();
export type { ApiResponse, PaginatedResponse };
