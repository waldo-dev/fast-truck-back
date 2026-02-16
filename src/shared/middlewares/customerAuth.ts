import { Response, NextFunction } from 'express';
import { AppError } from '../errors';
import { Customer } from '../database/models';

export interface CustomerRequest extends Express.Request {
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
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionToken = req.headers['x-session-token'] as string;

    if (!sessionToken) {
      throw new AppError('Session token required', 401);
    }

    // Por ahora, usamos un sistema simple: el token contiene el customer_id
    // En producción, deberías usar un sistema más robusto (Redis, JWT, etc.)
    // Por simplicidad, asumimos que el token es el customer_id (esto es temporal)
    // TODO: Implementar verificación real del token

    // Por ahora, requerimos que el customer_id venga en el header también
    const customerId = parseInt(req.headers['x-customer-id'] as string, 10);

    if (!customerId || isNaN(customerId)) {
      throw new AppError('Invalid customer ID', 401);
    }

    const customer = await Customer.findByPk(customerId, {
      attributes: ['id', 'phone', 'business_id'],
    });

    if (!customer) {
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
    next(error);
  }
};


