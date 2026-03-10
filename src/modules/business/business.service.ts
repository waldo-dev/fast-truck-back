import { AppError } from '../../shared/errors';
import { UserRole } from '../../shared/database/models/enums';
import { businessRepository } from './business.repository';
import { UserBusiness } from '../../shared/database/models/UserBusiness';
import { subscriptionRepository } from '../subscriptions/subscription.repository';
import { SubscriptionStatus } from '../../shared/database/models/enums';
import { Plan } from '../../shared/database/models';

export class BusinessService {
  public async getAllbusiness(businessId: number) {
    return businessRepository.findAll(businessId);
  }

  public async getAllBusinessesAdmin() {
    return businessRepository.findAllAdmin();
  }

  public async getBusinessesForUser(userId: number) {
    return businessRepository.findByUser(userId);
  }

  public async getBusinessById(id: number, businessId: number) {
    const business = await businessRepository.findById(id);
    return business;
  }

  public async createBusiness(
    data: {
      name: string;
      brand_name?: string | null;
      logo_url?: string | null;
      primary_color?: string | null;
      secondary_color?: string | null;
      created_by_user_id?: number | null;
      plan_id?: number | string;
      billing_period?: 'monthly' | 'yearly';
    },
    userRole: UserRole,
    userId: number
  ) {
    // Permitir ADMIN o BUSINESS_OWNER
    if (![UserRole.ADMIN, UserRole.BUSINESS_OWNER].includes(userRole)) {
      throw new AppError('Only ADMIN or BUSINESS_OWNER can create business', 403);
    }

    const business = await businessRepository.create({
      ...data,
      created_by_user_id: userId,
    });

    // Asociar al usuario creador en la tabla intermedia
    await UserBusiness.create({ user_id: userId, business_id: business.id });

    // Crear suscripción:
    // - Si viene plan_id, se crea suscripción ACTIVE con periodo según billing_period (monthly/yearly)
    // - Si no, se crea trial de 30 días en plan Pro (o primer plan disponible)
    const now = new Date();
    if (data.plan_id) {
      const planIdNum = typeof data.plan_id === 'string' ? parseInt(data.plan_id, 10) : data.plan_id;
      const plan = await Plan.findByPk(planIdNum);
      if (!plan) {
        throw new AppError('Plan not found', 400);
      }

      const periodEnd = new Date(now);
      if (data.billing_period === 'yearly') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        // monthly por defecto
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      await subscriptionRepository.create({
        business_id: business.id,
        plan_id: plan.id,
        status: SubscriptionStatus.ACTIVE,
        current_period_start: now,
        current_period_end: periodEnd,
      });
    } else {
      const trialEnds = new Date(now);
      trialEnds.setDate(trialEnds.getDate() + 30);

      const proPlan = await Plan.findOne({ where: { name: 'Pro' } });
      const fallbackPlan = proPlan || (await Plan.findOne({ order: [['id', 'ASC']] }));

      if (fallbackPlan) {
        await subscriptionRepository.create({
          business_id: business.id,
          plan_id: fallbackPlan.id,
          status: SubscriptionStatus.TRIAL,
          trial_ends_at: trialEnds,
        });
      }
    }
    return business;
  }

  public async updateBusiness(
    id: number,
    data: {
      name?: string;
      brand_name?: string | null;
      logo_url?: string | null;
      primary_color?: string | null;
      secondary_color?: string | null;
    },
    userRole: UserRole
  ) {
    // Permitir ADMIN o BUSINESS_OWNER
    if (![UserRole.ADMIN, UserRole.BUSINESS_OWNER].includes(userRole)) {
      throw new AppError('Only ADMIN or BUSINESS_OWNER can update business', 403);
    }

    const business = await businessRepository.update(id, data);
    return business;
  }

  public async deleteBusiness(id: number, userRole: UserRole) {
    // Solo ADMIN puede eliminar business
    if (userRole !== UserRole.ADMIN) {
      throw new AppError('Only ADMIN can delete business', 403);
    }

    await businessRepository.delete(id);
  }

  public async getOperatingContext(businessId: number) {
    return businessRepository.getOperatingContext(businessId);
  }

  public async updateOperatingContext(
    businessId: number,
    data: { mode: 'LOCAL' | 'EVENT'; location_id?: number | null; event_id?: number | null },
    role: UserRole
  ) {
    if (![UserRole.ADMIN, UserRole.BUSINESS_OWNER].includes(role)) {
      throw new AppError('Only ADMIN or BUSINESS_OWNER can update operating context', 403);
    }

    if (data.mode === 'LOCAL' && !data.location_id) {
      throw new AppError('location_id is required for LOCAL mode', 400);
    }

    if (data.mode === 'EVENT' && !data.event_id) {
      throw new AppError('event_id is required for EVENT mode', 400);
    }

    const context = await businessRepository.upsertOperatingContext({
      business_id: businessId,
      mode: data.mode,
      location_id: data.mode === 'LOCAL' ? data.location_id ?? null : null,
      event_id: data.mode === 'EVENT' ? data.event_id ?? null : null,
    });

    return context;
  }

  public async getDashboardOverview(userId: number) {
    const businesses = await businessRepository.findByUser(userId);
    const businessIds = businesses.map((b) => b.id);

    if (!businessIds.length) {
      return {
        businesses: [],
        totals: {
          total_orders: 0,
          today_orders: 0,
          active_products: 0,
        },
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    const totals = await businessRepository.getDashboardTotals(businessIds, today, end);

    return {
      businesses,
      totals,
    };
  }

  public async getDashboardRecentOrders(userId: number) {
    const businesses = await businessRepository.findByUser(userId);
    const businessIds = businesses.map((b) => b.id);
    if (!businessIds.length) return [];
    return businessRepository.getRecentOrders(businessIds, 10);
  }

  public async getDashboardTopBusinesses(userId: number) {
    const businesses = await businessRepository.findByUser(userId);
    const businessIds = businesses.map((b) => b.id);
    if (!businessIds.length) return [];
    return businessRepository.getTopBusinessesBySales(businessIds, 5);
  }
}

export const businessService = new BusinessService();


