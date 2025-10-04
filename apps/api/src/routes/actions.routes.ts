import { Router } from 'express';
import { TeamService } from '../services/teamService';

export const actionsRouter = Router();

// Action 1: Add User to Team
actionsRouter.post('/add-user-to-team', async (req, res) => {
  try {
    const { userId, teamId } = req.body;
    
    if (!userId || !teamId) {
      return res.status(400).json({ error: 'userId and teamId are required' });
    }
    
    const results = await TeamService.addUserToTeam(userId, teamId);
    
    res.status(200).json({
      success: true,
      action: 'add_user_to_team',
      results
    });
  } catch (error) {
    res.status(500).json({ 
      error: (error as Error).message || 'Failed to add user to team' 
    });
  }
});

// Action 2: Remove User from Team
actionsRouter.post('/remove-user-from-team', async (req, res) => {
  try {
    const { userId, teamId } = req.body;
    
    if (!userId || !teamId) {
      return res.status(400).json({ error: 'userId and teamId are required' });
    }
    
    const results = await TeamService.removeUserFromTeam(userId, teamId);
    
    res.status(200).json({
      success: true,
      action: 'remove_user_from_team',
      results
    });
  } catch (error) {
    res.status(500).json({ 
      error: (error as Error).message || 'Failed to remove user from team' 
    });
  }
});

// Action 3: Assign Manager
actionsRouter.post('/assign-manager', async (req, res) => {
  try {
    const { userId, managerId } = req.body;
    
    if (!userId || !managerId) {
      return res.status(400).json({ error: 'userId and managerId are required' });
    }
    
    const results = await TeamService.assignManager(userId, managerId);
    
    res.status(200).json({
      success: true,
      action: 'assign_manager',
      results
    });
  } catch (error) {
    res.status(400).json({ 
      error: (error as Error).message || 'Failed to assign manager' 
    });
  }
});

// Action 4: Remove Manager
actionsRouter.post('/remove-manager', async (req, res) => {
  try {
    const { userId, managerId } = req.body;
    
    if (!userId || !managerId) {
      return res.status(400).json({ error: 'userId and managerId are required' });
    }
    
    const results = await TeamService.removeManager(userId, managerId);
    
    res.status(200).json({
      success: true,
      action: 'remove_manager',
      results
    });
  } catch (error) {
    res.status(500).json({ 
      error: (error as Error).message || 'Failed to remove manager' 
    });
  }
});

// Action 5: Assign Resource to Team
actionsRouter.post('/assign-resource-to-team', async (req, res) => {
  try {
    const { teamId, resourceId } = req.body;
    
    if (!teamId || !resourceId) {
      return res.status(400).json({ error: 'teamId and resourceId are required' });
    }
    
    const results = await TeamService.assignResourceToTeam(teamId, resourceId);
    
    res.status(200).json({
      success: true,
      action: 'assign_resource_to_team',
      results
    });
  } catch (error) {
    res.status(500).json({ 
      error: (error as Error).message || 'Failed to assign resource to team' 
    });
  }
});

// Action 6: Remove Resource from Team
actionsRouter.post('/remove-resource-from-team', async (req, res) => {
  try {
    const { teamId, resourceId } = req.body;
    
    if (!teamId || !resourceId) {
      return res.status(400).json({ error: 'teamId and resourceId are required' });
    }
    
    const results = await TeamService.removeResourceFromTeam(teamId, resourceId);
    
    res.status(200).json({
      success: true,
      action: 'remove_resource_from_team',
      results
    });
  } catch (error) {
    res.status(500).json({ 
      error: (error as Error).message || 'Failed to remove resource from team' 
    });
  }
});

// Get all available actions
actionsRouter.get('/', (req, res) => {
  res.json({
    available_actions: [
      {
        name: 'add_user_to_team',
        method: 'POST',
        endpoint: '/api/actions/add-user-to-team',
        description: 'Add user to team with automatic manager inheritance',
        parameters: { userId: 'string', teamId: 'string' }
      },
      {
        name: 'remove_user_from_team',
        method: 'POST',
        endpoint: '/api/actions/remove-user-from-team',
        description: 'Remove user from team with cleanup logic',
        parameters: { userId: 'string', teamId: 'string' }
      },
      {
        name: 'assign_manager',
        method: 'POST',
        endpoint: '/api/actions/assign-manager',
        description: 'Assign manager with team inheritance',
        parameters: { userId: 'string', managerId: 'string' }
      },
      {
        name: 'remove_manager',
        method: 'POST',
        endpoint: '/api/actions/remove-manager',
        description: 'Remove manager with access recalculation',
        parameters: { userId: 'string', managerId: 'string' }
      },
      {
        name: 'assign_resource_to_team',
        method: 'POST',
        endpoint: '/api/actions/assign-resource-to-team',
        description: 'Assign resource to team',
        parameters: { teamId: 'string', resourceId: 'string' }
      },
      {
        name: 'remove_resource_from_team',
        method: 'POST',
        endpoint: '/api/actions/remove-resource-from-team',
        description: 'Remove resource from team',
        parameters: { teamId: 'string', resourceId: 'string' }
      }
    ]
  });
});

