import { AppError } from '../../shared/errors';
import { UserRole, SubscriptionStatus, PaymentStatus } from '../../shared/database/models/enums';
import { subscriptionRepository } from './subscription.repository';

export class SubscriptionService {
  private ensureWriteAccess(userRole: UserRole) {
    if (![UserRole.ADMIN, UserRole.BUSINESS_OWNER].includes(userRole)) {
      throw new AppError('Only ADMIN or BUSINESS_OWNER can modify subscriptions', 403);
    }
  }

  public async getAll(
    businessId: number,
    filters?: { status?: SubscriptionStatus; plan_id?: number }
  ) {
    return subscriptionRepository.findAll(businessId, filters);
  }

  public async getById(id: number, businessId: number) {
    return subscriptionRepository.findById(id, businessId);
  }

  public async create(
    data: {
      plan_id: number;
      status?: SubscriptionStatus;
      trial_ends_at?: string | null;
      current_period_start?: string | null;
      current_period_end?: string | null;
      billing_period?: 'monthly' | 'yearly';
      cancel_at_period_end?: boolean;
      payment_provider?: string | null;
      provider_subscription_id?: string | null;
    },
    businessId: number,
    userRole: UserRole
  ) {
    this.ensureWriteAccess(userRole);
    const now = new Date();
    const start = data.current_period_start ? new Date(data.current_period_start) : now;
    const end = data.current_period_end
      ? new Date(data.current_period_end)
      : (() => {
          const d = new Date(start);
          if (data.billing_period === 'yearly') {
            d.setFullYear(d.getFullYear() + 1);
          } else {
            d.setMonth(d.getMonth() + 1);
          }
          return d;
        })();

    return subscriptionRepository.create({
      business_id: businessId,
      plan_id: data.plan_id,
      status: data.status,
      trial_ends_at: data.trial_ends_at ? new Date(data.trial_ends_at) : null,
      current_period_start: start,
      current_period_end: end,
      cancel_at_period_end: data.cancel_at_period_end,
      payment_provider: data.payment_provider ?? null,
      provider_subscription_id: data.provider_subscription_id ?? null,
    });
  }

  public async update(
    id: number,
    businessId: number,
    data: {
      status?: SubscriptionStatus;
      trial_ends_at?: string | null;
      current_period_start?: string | null;
      current_period_end?: string | null;
      billing_period?: 'monthly' | 'yearly';
      cancel_at_period_end?: boolean;
      payment_provider?: string | null;
      provider_subscription_id?: string | null;
    },
    userRole: UserRole
  ) {
    this.ensureWriteAccess(userRole);
    const start = data.current_period_start ? new Date(data.current_period_start) : undefined;
    const end = data.current_period_end
      ? new Date(data.current_period_end)
      : undefined;
    return subscriptionRepository.update(id, businessId, {
      status: data.status,
      trial_ends_at: data.trial_ends_at ? new Date(data.trial_ends_at) : null,
      current_period_start: start,
      current_period_end: end,
      cancel_at_period_end: data.cancel_at_period_end,
      payment_provider: data.payment_provider ?? null,
      provider_subscription_id: data.provider_subscription_id ?? null,
    });
  }

  public async addPayment(
    subscriptionId: number,
    businessId: number,
    data: {
      amount: number;
      currency?: string;
      status?: PaymentStatus;
      provider?: string | null;
      provider_payment_id?: string | null;
      paid_at?: string | null;
    },
    userRole: UserRole
  ) {
    this.ensureWriteAccess(userRole);
    return subscriptionRepository.addPayment(subscriptionId, businessId, {
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      provider: data.provider ?? null,
      provider_payment_id: data.provider_payment_id ?? null,
      paid_at: data.paid_at ? new Date(data.paid_at) : null,
    });
  }
}

export const subscriptionService = new SubscriptionService();


