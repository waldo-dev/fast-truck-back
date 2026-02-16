import { AppError } from '../../shared/errors';
import { UserRole } from '../../shared/database/models/enums';
import { productOptionRepository } from './product-option.repository';

export class ProductOptionService {
  public async getProductOptionById(id: number, businessId: number) {
    const option = await productOptionRepository.findById(id, businessId);
    return option;
  }

  public async createProductOption(
    productId: number,
    businessId: number,
    data: {
      option_type?: string | null;
      option_value?: string | null;
      extra_price?: number;
    },
    userRole: UserRole
  ) {
    // Solo ADMIN puede crear opciones
    if (userRole !== UserRole.ADMIN) {
      throw new AppError('Only ADMIN can create product options', 403);
    }

    const option = await productOptionRepository.create(productId, businessId, data);
    return option;
  }

  public async updateProductOption(
    id: number,
    businessId: number,
    data: {
      option_type?: string | null;
      option_value?: string | null;
      extra_price?: number;
    },
    userRole: UserRole
  ) {
    // Solo ADMIN puede actualizar opciones
    if (userRole !== UserRole.ADMIN) {
      throw new AppError('Only ADMIN can update product options', 403);
    }

    const option = await productOptionRepository.update(id, businessId, data);
    return option;
  }

  public async deleteProductOption(id: number, businessId: number, userRole: UserRole) {
    // Solo ADMIN puede eliminar opciones
    if (userRole !== UserRole.ADMIN) {
      throw new AppError('Only ADMIN can delete product options', 403);
    }

    await productOptionRepository.delete(id, businessId);
  }
}

export const productOptionService = new ProductOptionService();

