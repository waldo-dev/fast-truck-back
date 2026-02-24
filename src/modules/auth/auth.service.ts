import bcrypt from 'bcrypt';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { env } from '../../config/env';
import { AppError } from '../../shared/errors';
import { authRepository } from './auth.repository';

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

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      business_id: user.business_id,
      active: user.active,
      created_at: user.created_at,
    };
  }
}

export const authService = new AuthService();

