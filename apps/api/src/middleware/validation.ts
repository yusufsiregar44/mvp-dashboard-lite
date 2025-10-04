import { Request, Response, NextFunction } from 'express';

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export class ValidationError extends Error {
  public errors: ValidationErrorDetail[];

  constructor(errors: ValidationErrorDetail[]) {
    super('Validation failed');
    this.errors = errors;
    this.name = 'ValidationError';
  }
}

export const validateUser = (req: Request, res: Response, next: NextFunction) => {
  const errors: ValidationErrorDetail[] = [];
  const { name, email, role } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Name is required' });
  }

  if (!email || typeof email !== 'string' || !isValidEmail(email)) {
    errors.push({ field: 'email', message: 'Valid email is required' });
  }

  if (!role || !['RM', 'Senior RM', 'Head of RM'].includes(role)) {
    errors.push({ field: 'role', message: 'Valid role is required (RM, Senior RM, Head of RM)' });
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors 
    });
  }

  next();
};

export const validateTeam = (req: Request, res: Response, next: NextFunction) => {
  const errors: ValidationErrorDetail[] = [];
  const { name, autoAssignClients } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Team name is required' });
  }

  if (autoAssignClients !== undefined && typeof autoAssignClients !== 'boolean') {
    errors.push({ field: 'autoAssignClients', message: 'autoAssignClients must be a boolean' });
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors 
    });
  }

  next();
};

export const validateResource = (req: Request, res: Response, next: NextFunction) => {
  const errors: ValidationErrorDetail[] = [];
  const { name, type } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Resource name is required' });
  }

  if (!type || typeof type !== 'string' || type.trim().length === 0) {
    errors.push({ field: 'type', message: 'Resource type is required' });
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors 
    });
  }

  next();
};

export const validateUserManager = (req: Request, res: Response, next: NextFunction) => {
  const errors: ValidationErrorDetail[] = [];
  const { userId, managerId } = req.params || req.body;

  if (!userId || typeof userId !== 'string') {
    errors.push({ field: 'userId', message: 'User ID is required' });
  }

  if (!managerId || typeof managerId !== 'string') {
    errors.push({ field: 'managerId', message: 'Manager ID is required' });
  }

  if (userId === managerId) {
    errors.push({ field: 'managerId', message: 'User cannot manage themselves' });
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors 
    });
  }

  next();
};

export const validateTeamMember = (req: Request, res: Response, next: NextFunction) => {
  const errors: ValidationErrorDetail[] = [];
  const { teamId, userId, accessType, grantedVia } = req.body;

  if (!teamId || typeof teamId !== 'string') {
    errors.push({ field: 'teamId', message: 'Team ID is required' });
  }

  if (!userId || typeof userId !== 'string') {
    errors.push({ field: 'userId', message: 'User ID is required' });
  }

  if (!accessType || !['direct', 'manager'].includes(accessType)) {
    errors.push({ field: 'accessType', message: 'Valid access type is required (direct, manager)' });
  }

  if (accessType === 'manager' && (!grantedVia || typeof grantedVia !== 'string')) {
    errors.push({ field: 'grantedVia', message: 'Granted via user ID is required for manager access' });
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors 
    });
  }

  next();
};

export const validateTeamResource = (req: Request, res: Response, next: NextFunction) => {
  const errors: ValidationErrorDetail[] = [];
  const { teamId, resourceId } = req.body;

  if (!teamId || typeof teamId !== 'string') {
    errors.push({ field: 'teamId', message: 'Team ID is required' });
  }

  if (!resourceId || typeof resourceId !== 'string') {
    errors.push({ field: 'resourceId', message: 'Resource ID is required' });
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors 
    });
  }

  next();
};

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

