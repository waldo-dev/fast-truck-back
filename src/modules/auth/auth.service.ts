import bcrypt from 'bcrypt';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { env } from '../../config/env';
import { AppError } from '../../shared/errors';
import { authRepository } from './auth.repository';
import { Business, Subscription, Plan } from '../../shared/database/models';
import { Op } from 'sequelize';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  role: string;
  businessId: string | null;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    business_id: number | null;
    businessId: string | null;
  };
}

export class AuthService {
  public async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { email, password } = credentials;

    const user = await authRepository.findByEmail(email);

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    if (!user.active) {
      throw new AppError('User account is inactive', 403);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      business_id: user.business_id,
    };

    const token = jwt.sign(tokenPayload, env.JWT_SECRET as Secret, {
      expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    });

    const businessIdString = user.business_id !== null ? String(user.business_id) : null;

    return {
      token,
      role: user.role,
      businessId: businessIdString,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        business_id: user.business_id,
        businessId: businessIdString,
      },
    };
  }

  public async getCurrentUser(userId: number) {
    const user = await authRepository.findById(userId);

    let business: any = null;
    let subscription: any = null;

    if (user.business_id) {
      // Buscar negocio
      business = await Business.findByPk(user.business_id, {
        attributes: ['id', 'name', 'brand_name', 'logo_url'],
      });

      // Última suscripción (más reciente por created_at)
      const sub = await Subscription.findOne({
        where: { business_id: user.business_id },
        include: [{ model: Plan, as: 'plan', attributes: ['id', 'name'] }],
        order: [['created_at', 'DESC']],
      });

      if (sub) {
        subscription = {
          id: sub.id,
          status: sub.status,
          plan: sub.get('plan'),
          trial_ends_at: sub.trial_ends_at,
          current_period_start: sub.current_period_start,
          current_period_end: sub.current_period_end,
          cancel_at_period_end: sub.cancel_at_period_end,
        };
      }
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      business_id: user.business_id,
      active: user.active,
      created_at: user.created_at,
      business,
      subscription,
    };
  }
}

export const authService = new AuthService();

