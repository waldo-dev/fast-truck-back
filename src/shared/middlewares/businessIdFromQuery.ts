import { Response, NextFunction } from 'express';
import { AppError } from '../errors';
import { CustomerRequest } from './customerAuth';
import { Business } from '../database/models';

/**
 * Middleware para extraer business_id de query params o body
 * Útil para endpoints públicos que no requieren autenticación JWT
 */
export const extractBusinessId = async (req: CustomerRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    let businessId =
      req.business_id ||
      parseInt(req.query.business_id as string, 10) ||
      parseInt(req.body.business_id, 10) ||
      parseInt(req.headers['x-business-id'] as string, 10);

    if ((!businessId || isNaN(businessId)) && req.query.slug) {
      const slug = String(req.query.slug);
      const business = await Business.findOne({
        where: { slug },
        attributes: ['id'],
      });
      if (business) {
        businessId = business.id;
      }
    }

    if (!businessId || isNaN(businessId)) {
      throw new AppError('Business ID is required', 400);
    }

    req.business_id = businessId;
    return next();
  } catch (error) {
    return next(error);
  }
};


