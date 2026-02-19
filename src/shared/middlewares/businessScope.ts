import { Response, NextFunction } from 'express';
import { AppError } from '../errors';
import { AuthRequest } from './auth';

/**
 * Middleware para inyectar business_id desde JWT
 * Debe usarse después de authenticate
 */
export const injectBusinessId = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  if (!req.user.business_id) {
    throw new AppError('User is not associated with a business', 403);
  }

  req.business_id = req.user.business_id;
  next();
};

