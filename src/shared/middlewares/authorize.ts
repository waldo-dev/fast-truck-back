import { Response, NextFunction } from 'express';
import { AppError } from '../errors';
import { AuthRequest } from './auth';
import { UserRole } from '../database/models/enums';

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (!roles.includes(req.user.role as UserRole)) {
      throw new AppError('Insufficient permissions', 403);
    }

    next();
  };
};


