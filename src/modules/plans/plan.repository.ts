import { Plan } from '../../shared/database/models';
import { AppError } from '../../shared/errors';

export class PlanRepository {
  public async findAll(filters?: { active?: boolean }) {
    const where: any = {};
    if (filters?.active !== undefined) {
      where.active = filters.active;
    }
    return Plan.findAll({ where, order: [['id', 'ASC']] });
  }

  public async findById(id: number) {
    const plan = await Plan.findByPk(id);
    if (!plan) {
      throw new AppError('Plan not found', 404);
    }
    return plan;
  }

  public async create(data: {
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
  }) {
    const plan = await Plan.create({
      ...data,
      active: data.active ?? true,
    });
    return plan;
  }

  public async update(
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
    }
  ) {
    const plan = await this.findById(id);
    await plan.update(data);
    return plan;
  }
}

export const planRepository = new PlanRepository();




