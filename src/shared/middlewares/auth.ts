import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AppError } from '../errors';
import { User } from '../database/models';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
    business_id: number | null;
  };
  business_id?: number;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.substring(7);

    if (!token) {
      throw new AppError('No token provided', 401);
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: number;
      email: string;
      name: string;
      role: string;
      business_id?: number | null;
    };

    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'email', 'name', 'role', 'business_id', 'active'],
    });

    if (!user || !user.active) {
      throw new AppError('User not found or inactive', 401);
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      business_id: user.business_id,
    };

    // Inyectar business_id en el request para scoping
    if (user.business_id) {
      req.business_id = user.business_id;
    }

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else {
      next(error);
    }
  }
};

