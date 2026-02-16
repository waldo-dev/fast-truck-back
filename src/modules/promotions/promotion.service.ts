import { AppError } from '../../shared/errors';
import { UserRole, DiscountType } from '../../shared/database/models/enums';
import { promotionRepository } from './promotion.repository';

export class PromotionService {
  public async getAllPromotions(businessId: number, filters?: { active?: boolean }) {
    const promotions = await promotionRepository.findAll(businessId, filters);
    return promotions;
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
    },
    businessId: number,
    userRole: UserRole
  ) {
    // Solo ADMIN puede crear promociones
    if (userRole !== UserRole.ADMIN) {
      throw new AppError('Only ADMIN can create promotions', 403);
    }

    const promotion = await promotionRepository.create({
      business_id: businessId,
      name: data.name,
      description: data.description,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      start_date: data.start_date ? new Date(data.start_date) : null,
      end_date: data.end_date ? new Date(data.end_date) : null,
      active: data.active,
      product_ids: data.product_ids,
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
    },
    userRole: UserRole
  ) {
    // Solo ADMIN puede actualizar promociones
    if (userRole !== UserRole.ADMIN) {
      throw new AppError('Only ADMIN can update promotions', 403);
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
    // Solo ADMIN puede agregar productos
    if (userRole !== UserRole.ADMIN) {
      throw new AppError('Only ADMIN can add products to promotions', 403);
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
    // Solo ADMIN puede remover productos
    if (userRole !== UserRole.ADMIN) {
      throw new AppError('Only ADMIN can remove products from promotions', 403);
    }

    const promotion = await promotionRepository.removeProducts(id, businessId, productIds);
    return promotion;
  }

  public async deletePromotion(id: number, businessId: number, userRole: UserRole) {
    // Solo ADMIN puede eliminar promociones
    if (userRole !== UserRole.ADMIN) {
      throw new AppError('Only ADMIN can delete promotions', 403);
    }

    await promotionRepository.delete(id, businessId);
  }
}

export const promotionService = new PromotionService();


