import { AppError } from '../../shared/errors';
import { UserRole } from '../../shared/database/models/enums';
import { planRepository } from './plan.repository';

export class PlanService {
  private ensureAdmin(userRole: UserRole) {
    if (userRole !== UserRole.ADMIN) {
      throw new AppError('Only ADMIN can manage plans', 403);
    }
  }

  public async getAllPlans(filters?: { active?: boolean }) {
    return planRepository.findAll(filters);
  }

  public async getPlanById(id: number) {
    return planRepository.findById(id);
  }

  public async createPlan(
    data: {
      name: string;
      description?: string | null;
      price_monthly?: number | null;
      price_yearly?: number | null;
      max_events?: number | null;
      max_products?: number | null;
      max_users?: number | null;
      max_locations?: number | null;
      features?: any;
      active?: boolean;
    },
    userRole: UserRole
  ) {
    this.ensureAdmin(userRole);
    return planRepository.create(data);
  }

  public async updatePlan(
    id: number,
    data: {
      name?: string;
      description?: string | null;
      price_monthly?: number | null;
      price_yearly?: number | null;
      max_events?: number | null;
      max_products?: number | null;
      max_users?: number | null;
      max_locations?: number | null;
      features?: any;
      active?: boolean;
    },
    userRole: UserRole
  ) {
    this.ensureAdmin(userRole);
    return planRepository.update(id, data);
  }
}

export const planService = new PlanService();







