import { AppError } from '../../shared/errors';
import { UserRole } from '../../shared/database/models/enums';
import { categoryRepository } from './category.repository';
import { UserBusiness } from '../../shared/database/models';

export class CategoryService {
  public async bulkCreate(
    businessIds: number[],
    name: string,
    userRole: UserRole,
    userId: number
  ) {
    if (![UserRole.ADMIN, UserRole.BUSINESS_OWNER].includes(userRole)) {
      throw new AppError('Only ADMIN or BUSINESS_OWNER can create categories', 403);
    }

    const uniqueBusinessIds = [...new Set(businessIds)].filter(Boolean);

    // Validar pertenencia si es owner
    if (userRole === UserRole.BUSINESS_OWNER) {
      const links = await UserBusiness.findAll({
        where: { user_id: userId },
        attributes: ['business_id'],
      });
      const allowed = new Set(links.map((l) => l.business_id).filter(Boolean));
      const unauthorized = uniqueBusinessIds.filter((id) => !allowed.has(id));
      if (unauthorized.length > 0) {
        throw new AppError(`Business not associated to this owner: ${unauthorized.join(',')}`, 403);
      }
    }

    const results: Array<{ business_id: number; category?: any; error?: string }> = [];

    for (const businessId of uniqueBusinessIds) {
      try {
        const category = await categoryRepository.create({
          business_id: businessId,
          name: name,
        });
        results.push({ business_id: businessId, category });
      } catch (err: any) {
        results.push({
          business_id: businessId,
          error: err?.message || 'Unexpected error',
        });
      }
    }

    return results;
  }

  public async getAllCategories(businessId: number) {
    const categories = await categoryRepository.findAll(businessId);
    return categories;
  }

  public async getCategoriesByOwner(userId: number, userRole: UserRole, businessId?: number) {
    if (userRole !== UserRole.BUSINESS_OWNER) {
      throw new AppError('Only BUSINESS_OWNER can access this resource', 403);
    }

    const businessLinks = await UserBusiness.findAll({
      where: { user_id: userId },
      attributes: ['business_id'],
    });

    const businessIds = [...new Set(businessLinks.map((link) => link.business_id).filter(Boolean))];

    if (businessIds.length === 0) {
      return [];
    }

    let targetBusinessIds = businessIds;

    if (businessId) {
      if (!businessIds.includes(businessId)) {
        throw new AppError('Business not associated to this owner', 403);
      }
      targetBusinessIds = [businessId];
    }

    const categories = await categoryRepository.findAllByBusinessIds(targetBusinessIds);
    // Evitar duplicados por nombre (primer match se queda)
    const seen = new Set<string>();
    const uniqueByName = categories.filter((cat: any) => {
      const key = (cat.name || '').toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

    return uniqueByName;
  }

  public async getCategoryById(id: number, businessId: number) {
    const category = await categoryRepository.findById(id, businessId);
    return category;
  }

  public async createCategory(data: { name: string }, businessId: number, userRole: UserRole) {
    // ADMIN y BUSINESS_OWNER pueden crear categorías
    if (![UserRole.ADMIN, UserRole.BUSINESS_OWNER].includes(userRole)) {
      throw new AppError('Only ADMIN or BUSINESS_OWNER can create categories', 403);
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


