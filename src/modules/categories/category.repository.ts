import { Category } from '../../shared/database/models';
import { AppError } from '../../shared/errors';

export class CategoryRepository {
  public async findAll(businessId: number) {
    const categories = await Category.findAll({
      where: {
        business_id: businessId,
        deleted_at: null,
      },
      order: [['name', 'ASC']],
    });

    return categories;
  }

  public async findById(id: number, businessId: number) {
    const category = await Category.findOne({
      where: {
        id,
        business_id: businessId,
        deleted_at: null,
      },
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    return category;
  }

  public async create(data: { business_id: number; name: string }) {
    const category = await Category.create(data);
    return category;
  }

  public async update(id: number, businessId: number, data: { name?: string }) {
    const category = await this.findById(id, businessId);

    await category.update(data);
    return category.reload();
  }

  public async delete(id: number, businessId: number) {
    const category = await this.findById(id, businessId);
    // Soft delete
    await category.update({ deleted_at: new Date() });
  }
}

export const categoryRepository = new CategoryRepository();

