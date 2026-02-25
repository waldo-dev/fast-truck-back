import { AppError } from '../../shared/errors';
import { UserRole, DiscountType } from '../../shared/database/models/enums';
import { promotionRepository } from './promotion.repository';
import { UserBusiness } from '../../shared/database/models';

export class PromotionService {
  private async ensureOwnerAccess(userRole: UserRole, userId: number | undefined, businessIds: number[]) {
    if (userRole !== UserRole.BUSINESS_OWNER) return;
    if (!userId) {
      throw new AppError('User ID is required', 400);
    }
    const links = await UserBusiness.findAll({
      where: { user_id: userId },
      attributes: ['business_id'],
    });
    const allowed = new Set(links.map((l) => l.business_id).filter(Boolean));
    const unauthorized = businessIds.filter((id) => !allowed.has(id));
    if (unauthorized.length > 0) {
      throw new AppError(`Business not associated to this user: ${unauthorized.join(',')}`, 403);
    }
  }

  private async getAllowedBusinessIds(userId: number, defaultBusinessId?: number | null) {
    const ids = new Set<number>();
    if (defaultBusinessId) ids.add(defaultBusinessId);

    const links = await UserBusiness.findAll({
      where: { user_id: userId },
      attributes: ['business_id'],
    });

    links.forEach((l) => {
      if (l.business_id) ids.add(l.business_id);
    });

    return Array.from(ids);
  }

  public async getAllPromotions(businessId: number, filters?: { active?: boolean }) {
    const promotions = await promotionRepository.findAll(businessId, filters);
    return promotions;
  }

  public async getPromotionsByBusinessIds(
    userId: number,
    userRole: UserRole,
    businessIds: number[] | undefined,
    requesterBusinessId?: number | null,
    filters?: { active?: boolean }
  ) {
    if (![UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR].includes(userRole)) {
      throw new AppError('Only ADMIN, BUSINESS_OWNER or LOCAL_OPERATOR can access this resource', 403);
    }

    let targetBusinessIds: number[] = [];

    if (userRole === UserRole.ADMIN) {
      targetBusinessIds =
        businessIds && businessIds.length > 0
          ? Array.from(new Set(businessIds))
          : requesterBusinessId
          ? [requesterBusinessId]
          : [];
      if (targetBusinessIds.length === 0) {
        throw new AppError('At least one business_id is required', 400);
      }
    } else {
      const allowed = await this.getAllowedBusinessIds(userId, requesterBusinessId);
      if (allowed.length === 0) {
        return [];
      }
      targetBusinessIds =
        businessIds && businessIds.length > 0 ? Array.from(new Set(businessIds)) : Array.from(new Set(allowed));

      const unauthorized = targetBusinessIds.filter((id) => !allowed.includes(id));
      if (unauthorized.length > 0) {
        throw new AppError(`Business not associated to this user: ${unauthorized.join(',')}`, 403);
      }
    }

    return promotionRepository.findAllByBusinessIds(targetBusinessIds, filters);
  }

  public async getPromotionById(id: number, businessId: number) {
    const promotion = await promotionRepository.findById(id, businessId);
    return promotion;
  }

  public async createPromotion(
    data: {
      name: string;
      description?: string | null;
      discount_type: DiscountType;
      discount_value: number;
      start_date?: string | null;
      end_date?: string | null;
      active?: boolean;
      product_ids?: number[];
      business_ids?: number[];
    },
    businessId: number,
    userRole: UserRole,
    userId: number
  ) {
    // ADMIN o BUSINESS_OWNER
    if (![UserRole.ADMIN, UserRole.BUSINESS_OWNER].includes(userRole)) {
      throw new AppError('Only ADMIN or BUSINESS_OWNER can create promotions', 403);
    }

    const targetBusinessIds =
      data.business_ids && data.business_ids.length > 0
        ? Array.from(new Set(data.business_ids))
        : [businessId];

    if (targetBusinessIds.length === 0) {
      throw new AppError('At least one business is required to create a promotion', 400);
    }

    await this.ensureOwnerAccess(userRole, userId, targetBusinessIds);

    const primaryBusinessId = targetBusinessIds[0];

    const promotion = await promotionRepository.create({
      business_id: primaryBusinessId,
      name: data.name,
      description: data.description,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      start_date: data.start_date ? new Date(data.start_date) : null,
      end_date: data.end_date ? new Date(data.end_date) : null,
      active: data.active,
      product_ids: data.product_ids,
      business_ids: targetBusinessIds,
    });

    return promotion;
  }

  public async updatePromotion(
    id: number,
    businessId: number,
    data: {
      name?: string;
      description?: string | null;
      discount_type?: DiscountType;
      discount_value?: number;
      start_date?: string | null;
      end_date?: string | null;
      active?: boolean;
      product_ids?: number[];
      business_ids?: number[];
    },
    userRole: UserRole,
    userId: number
  ) {
    if (![UserRole.ADMIN, UserRole.BUSINESS_OWNER].includes(userRole)) {
      throw new AppError('Only ADMIN or BUSINESS_OWNER can update promotions', 403);
    }

    if (data.business_ids && data.business_ids.length > 0) {
      await this.ensureOwnerAccess(userRole, userId, Array.from(new Set(data.business_ids)));
    } else {
      await this.ensureOwnerAccess(userRole, userId, [businessId]);
    }

    const promotion = await promotionRepository.update(id, businessId, {
      name: data.name,
      description: data.description,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      start_date: data.start_date ? new Date(data.start_date) : undefined,
      end_date: data.end_date ? new Date(data.end_date) : undefined,
      active: data.active,
      product_ids: data.product_ids,
      business_ids: data.business_ids,
    });

    return promotion;
  }

  public async togglePromotionStatus(id: number, businessId: number, active: boolean, userRole: UserRole) {
    // Solo ADMIN puede activar/desactivar promociones
    if (userRole !== UserRole.ADMIN) {
      throw new AppError('Only ADMIN can toggle promotion status', 403);
    }

    const promotion = await promotionRepository.toggleStatus(id, businessId, active);
    return promotion;
  }

  public async addProductsToPromotion(
    id: number,
    businessId: number,
    productIds: number[],
    userRole: UserRole
  ) {
    if (![UserRole.ADMIN, UserRole.BUSINESS_OWNER].includes(userRole)) {
      throw new AppError('Only ADMIN or BUSINESS_OWNER can add products to promotions', 403);
    }

    const promotion = await promotionRepository.addProducts(id, businessId, productIds);
    return promotion;
  }

  public async removeProductsFromPromotion(
    id: number,
    businessId: number,
    productIds: number[],
    userRole: UserRole
  ) {
    if (![UserRole.ADMIN, UserRole.BUSINESS_OWNER].includes(userRole)) {
      throw new AppError('Only ADMIN or BUSINESS_OWNER can remove products from promotions', 403);
    }

    const promotion = await promotionRepository.removeProducts(id, businessId, productIds);
    return promotion;
  }

  public async deletePromotion(id: number, businessId: number, userRole: UserRole) {
    if (![UserRole.ADMIN, UserRole.BUSINESS_OWNER].includes(userRole)) {
      throw new AppError('Only ADMIN or BUSINESS_OWNER can delete promotions', 403);
    }

    await promotionRepository.delete(id, businessId);
  }
}

export const promotionService = new PromotionService();


