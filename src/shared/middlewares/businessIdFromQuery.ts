import { Response, NextFunction } from 'express';
import { AppError } from '../errors';
import { CustomerRequest } from './customerAuth';

/**
 * Middleware para extraer business_id de query params o body
 * Útil para endpoints públicos que no requieren autenticación JWT
 */
export const extractBusinessId = (req: CustomerRequest, res: Response, next: NextFunction): void => {
  const businessId =
    req.business_id ||
    parseInt(req.query.business_id as string, 10) ||
    parseInt(req.body.business_id, 10) ||
    parseInt(req.headers['x-business-id'] as string, 10);

  if (!businessId || isNaN(businessId)) {
    throw new AppError('Business ID is required', 400);
  }

  req.business_id = businessId;
  next();
};

