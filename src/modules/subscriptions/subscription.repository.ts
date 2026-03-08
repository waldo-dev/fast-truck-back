import { Subscription, SubscriptionPayment, Plan, Business } from '../../shared/database/models';
import { AppError } from '../../shared/errors';
import { SubscriptionStatus, PaymentStatus } from '../../shared/database/models/enums';

export class SubscriptionRepository {
  public async findAll(
    businessId: number,
    filters?: { status?: SubscriptionStatus; plan_id?: number }
  ) {
    const where: any = { business_id: businessId };
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.plan_id) {
      where.plan_id = filters.plan_id;
    }

    return Subscription.findAll({
      where,
      include: [
        { model: Plan, as: 'plan' },
        { model: SubscriptionPayment, as: 'payments' },
      ],
      order: [['id', 'DESC']],
    });
  }

  public async findById(id: number, businessId: number) {
    const subscription = await Subscription.findOne({
      where: {
        id,
        business_id: businessId,
      },
      include: [
        { model: Plan, as: 'plan' },
        { model: SubscriptionPayment, as: 'payments' },
      ],
    });

    if (!subscription) {
      throw new AppError('Subscription not found', 404);
    }

    return subscription;
  }

  public async create(data: {
    business_id: number;
    plan_id: number;
    status?: SubscriptionStatus;
    trial_ends_at?: Date | null;
    current_period_start?: Date | null;
    current_period_end?: Date | null;
    cancel_at_period_end?: boolean;
    payment_provider?: string | null;
    provider_subscription_id?: string | null;
  }) {
    // Validar existencia de business
    const business = await Business.findByPk(data.business_id);
    if (!business) {
      throw new AppError('Business not found', 400);
    }

    // Validar plan
    const plan = await Plan.findByPk(data.plan_id);
    if (!plan) {
      throw new AppError('Plan not found', 400);
    }

    const subscription = await Subscription.create({
      ...data,
      status: data.status ?? SubscriptionStatus.ACTIVE,
    });

    return this.findById(subscription.id, data.business_id);
  }

  public async update(
    id: number,
    businessId: number,
    data: {
      status?: SubscriptionStatus;
      trial_ends_at?: Date | null;
      current_period_start?: Date | null;
      current_period_end?: Date | null;
      cancel_at_period_end?: boolean;
      payment_provider?: string | null;
      provider_subscription_id?: string | null;
    }
  ) {
    const subscription = await this.findById(id, businessId);
    await subscription.update(data);
    return this.findById(id, businessId);
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
      paid_at?: Date | null;
    }
  ) {
    const subscription = await this.findById(subscriptionId, businessId);

    const payment = await SubscriptionPayment.create({
      subscription_id: subscription.id,
      amount: data.amount,
      currency: data.currency ?? 'CLP',
      status: data.status ?? PaymentStatus.PENDING,
      provider: data.provider ?? null,
      provider_payment_id: data.provider_payment_id ?? null,
      paid_at: data.paid_at ?? null,
    });

    return payment;
  }
}

export const subscriptionRepository = new SubscriptionRepository();


