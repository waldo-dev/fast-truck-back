import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors';
import { Customer } from '../database/models';

export interface CustomerRequest extends Request {
  customer?: {
    id: number;
    phone: string;
    business_id: number | null;
  };
  business_id?: number;
}

/**
 * Middleware para autenticar customers por session_token
 * El token debe venir en el header X-Session-Token
 */
export const authenticateCustomer = async (
  req: CustomerRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionToken = req.headers['x-session-token'] as string;

    if (!sessionToken) {
      throw new AppError('Session token required', 401);
    }

    const claims = jwt.verify(sessionToken, env.JWT_SECRET, {
      audience: 'operfoods-customer',
    }) as { sub?: string; business_id?: number };
    const customerId = Number(claims.sub);
    if (!Number.isSafeInteger(customerId) || customerId <= 0)
      throw new AppError('Invalid customer session', 401);

    const customer = await Customer.findByPk(customerId, {
      attributes: ['id', 'phone', 'business_id'],
    });

    if (!customer || customer.business_id !== claims.business_id) {
      throw new AppError('Customer not found', 401);
    }

    req.customer = {
      id: customer.id,
      phone: customer.phone,
      business_id: customer.business_id,
    };

    if (customer.business_id) {
      req.business_id = customer.business_id;
    }

    next();
  } catch (error) {
    next(
      error instanceof jwt.JsonWebTokenError
        ? new AppError('Invalid customer session', 401)
        : error
    );
  }
};
