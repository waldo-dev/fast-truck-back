import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AppError } from '../../shared/errors';
import { authRepository } from './auth.repository';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
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

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        business_id: user.business_id,
      },
      env.JWT_SECRET,
      {
        expiresIn: env.JWT_EXPIRES_IN,
      }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        business_id: user.business_id,
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

