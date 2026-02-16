import { AppError } from '../../shared/errors';
import { UserRole } from '../../shared/database/models/enums';
import { categoryRepository } from './category.repository';

export class CategoryService {
  public async getAllCategories(businessId: number) {
    const categories = await categoryRepository.findAll(businessId);
    return categories;
  }

  public async getCategoryById(id: number, businessId: number) {
    const category = await categoryRepository.findById(id, businessId);
    return category;
  }

  public async createCategory(data: { name: string }, businessId: number, userRole: UserRole) {
    // Solo ADMIN puede crear categorías
    if (userRole !== UserRole.ADMIN) {
      throw new AppError('Only ADMIN can create categories', 403);
    }

    const category = await categoryRepository.create({
      business_id: businessId,
      name: data.name,
    });

    return category;
  }

  public async updateCategory(
    id: number,
    businessId: number,
    data: { name?: string },
    userRole: UserRole
  ) {
    // Solo ADMIN puede actualizar categorías
    if (userRole !== UserRole.ADMIN) {
      throw new AppError('Only ADMIN can update categories', 403);
    }

    const category = await categoryRepository.update(id, businessId, data);
    return category;
  }

  public async deleteCategory(id: number, businessId: number, userRole: UserRole) {
    // Solo ADMIN puede eliminar categorías
    if (userRole !== UserRole.ADMIN) {
      throw new AppError('Only ADMIN can delete categories', 403);
    }

    await categoryRepository.delete(id, businessId);
  }
}

export const categoryService = new CategoryService();


