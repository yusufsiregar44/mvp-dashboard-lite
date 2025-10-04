import { Router } from 'express';
import { db } from '../db';
import { userManagers } from '../schema';
import { desc, eq, and } from 'drizzle-orm';
import { validateUserManager } from '../middleware/validation';
import { 
  checkUserExists, 
  checkManagerExists, 
  preventCircularManagerRelationship, 
  checkDuplicateManagerRelationship 
} from '../middleware/businessRules';
import { TeamService } from '../services/teamService';

export const userManagersRouter = Router();

userManagersRouter.get('/', async (_req, res) => {
  const items = await db.select().from(userManagers).orderBy(desc(userManagers.createdAt));
  res.json(items);
});

// Simple test route first
userManagersRouter.post('/test', async (req, res) => {
  res.json({ message: 'Test route working', body: req.body });
});

// Minimal POST route without middleware for testing
userManagersRouter.post('/', async (req, res) => {
  console.log('POST /api/user-managers hit!', req.body);
  res.json({ message: 'POST route working', body: req.body });
});

// Assign Manager
userManagersRouter.post('/:userId/:managerId', 
  checkUserExists, 
  checkManagerExists, 
  checkDuplicateManagerRelationship,
  preventCircularManagerRelationship,
  validateUserManager,
  async (req, res) => {
    try {
      const { userId, managerId } = req.params;
      
      // Use the core business logic
      const results = await TeamService.assignManager(userId, managerId);
      
      res.status(200).json({ 
        success: true, 
        message: 'Manager relationship assigned successfully',
        results 
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to assign manager relationship' });
    }
  }
);

// Remove Manager
userManagersRouter.delete('/:userId/:managerId', 
  checkUserExists, 
  checkManagerExists, 
  async (req, res) => {
    try {
      const { userId, managerId } = req.params;
      
      console.log(`Attempting to remove manager relationship: ${managerId} -> ${userId}`);
      
      // Use the core business logic
      const results = await TeamService.removeManager(userId, managerId);
      
      console.log('Remove manager results:', results);
      
      res.status(200).json({ 
        success: true, 
        message: 'Manager relationship removed successfully',
        results 
      });
    } catch (error) {
      console.error('Error removing manager relationship:', error);
      res.status(500).json({ 
        error: 'Failed to delete manager relationship',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }
);

