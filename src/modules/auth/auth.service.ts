import bcrypt from 'bcrypt';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { env } from '../../config/env';
import { AppError } from '../../shared/errors';
import { authRepository } from './auth.repository';
import { Business, Subscription, Plan, RefreshToken } from '../../shared/database/models';
import crypto from 'crypto';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  refresh_token: string;
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
  business: BusinessContext | null;
  subscription: SubscriptionContext | null;
}

interface BusinessContext {
  id: number;
  name: string;
  brand_name: string | null;
  logo_url: string | null;
}

interface PlanContext {
  id: number;
  name: string;
}

interface SubscriptionContext {
  id: number;
  status: string;
  plan: PlanContext | null;
  trial_ends_at: Date | null;
  current_period_start: Date | null;
  current_period_end: Date | null;
  cancel_at_period_end: boolean | null;
}

export class AuthService {
  private generateAccessToken(payload: Record<string, unknown>) {
    return jwt.sign(payload, env.JWT_SECRET as Secret, {
      expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    });
  }

  private generateRawRefreshToken(): string {
    return crypto.randomBytes(48).toString('base64url');
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async issueRefreshToken(userId: number): Promise<string> {
    const raw = this.generateRawRefreshToken();
    const tokenHash = this.hashToken(raw);
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);

    await RefreshToken.create({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expires,
      revoked_at: null,
    });

    return raw;
  }

  private normalizeBusinessId(value?: string | number | null): number | null {
    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value === 'string' && value.trim() === '') {
      return null;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  private async buildBusinessContext(businessId: number | null): Promise<{
    business: BusinessContext | null;
    subscription: SubscriptionContext | null;
  }> {
    if (businessId === null) {
      return { business: null, subscription: null };
    }

    const business = await Business.findByPk(businessId, {
      attributes: ['id', 'name', 'brand_name', 'logo_url'],
    });

    if (!business) {
      return { business: null, subscription: null };
    }

    const subscriptionRecord = await Subscription.findOne({
      where: { business_id: businessId },
      include: [{ model: Plan, as: 'plan', attributes: ['id', 'name'] }],
      order: [['created_at', 'DESC']],
    });

    let subscription: SubscriptionContext | null = null;

    if (subscriptionRecord) {
      const plan = subscriptionRecord.get('plan') as Plan | null;
      subscription = {
        id: subscriptionRecord.id,
        status: subscriptionRecord.status,
        plan: plan
          ? {
              id: plan.id,
              name: plan.name,
            }
          : null,
        trial_ends_at: subscriptionRecord.trial_ends_at,
        current_period_start: subscriptionRecord.current_period_start,
        current_period_end: subscriptionRecord.current_period_end,
        cancel_at_period_end: subscriptionRecord.cancel_at_period_end,
      };
    }

    return {
      business: {
        id: business.id,
        name: business.name,
        brand_name: business.brand_name,
        logo_url: business.logo_url,
      },
      subscription,
    };
  }

  public async login(
    credentials: LoginCredentials,
    businessIdFromQuery?: string | null
  ): Promise<LoginResponse> {
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

    const token = this.generateAccessToken(tokenPayload);
    const refreshToken = await this.issueRefreshToken(user.id);

    const businessIdString = user.business_id !== null ? String(user.business_id) : null;
    const normalizedBusinessId = this.normalizeBusinessId(businessIdFromQuery ?? user.business_id);
    const businessContext = await this.buildBusinessContext(normalizedBusinessId);

    return {
      token,
      refresh_token: refreshToken,
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
      business: businessContext.business,
      subscription: businessContext.subscription,
    };
  }

  public async refresh(refreshToken: string, businessIdFromQuery?: string | null): Promise<LoginResponse> {
    if (!refreshToken) {
      throw new AppError('refresh_token is required', 400);
    }

    const tokenHash = this.hashToken(refreshToken);
    const stored = await RefreshToken.findOne({
      where: { token_hash: tokenHash },
    });

    if (!stored || stored.revoked_at) {
      throw new AppError('Invalid refresh token', 401);
    }

    if (stored.expires_at && stored.expires_at.getTime() < Date.now()) {
      throw new AppError('Refresh token expired', 401);
    }

    const user = await authRepository.findById(stored.user_id);

    if (!user.active) {
      throw new AppError('User account is inactive', 403);
    }

    // Rotar: revocar el actual y emitir uno nuevo
    await stored.update({ revoked_at: new Date() });

    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      business_id: user.business_id,
    };

    const newAccessToken = this.generateAccessToken(tokenPayload);
    const newRefreshToken = await this.issueRefreshToken(user.id);
    const businessIdString = user.business_id !== null ? String(user.business_id) : null;
    const normalizedBusinessId = this.normalizeBusinessId(businessIdFromQuery ?? user.business_id);
    const businessContext = await this.buildBusinessContext(normalizedBusinessId);

    return {
      token: newAccessToken,
      refresh_token: newRefreshToken,
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
      business: businessContext.business,
      subscription: businessContext.subscription,
    };
  }

  public async getCurrentUser(userId: number, businessIdFromQuery?: string | null) {
    const user = await authRepository.findById(userId);

    const normalizedBusinessId = this.normalizeBusinessId(businessIdFromQuery ?? user.business_id);
    const { business, subscription } = await this.buildBusinessContext(normalizedBusinessId);

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

