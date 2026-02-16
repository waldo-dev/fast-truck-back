import { ProductOption, Product } from '../../shared/database/models';
import { AppError } from '../../shared/errors';

export class ProductOptionRepository {
  public async findById(id: number, businessId: number) {
    const option = await ProductOption.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'business_id'],
        },
      ],
    });

    if (!option) {
      throw new AppError('Product option not found', 404);
    }

    const product = (option as any).product;
    if (!product || product.business_id !== businessId) {
      throw new AppError('Product option does not belong to this business', 403);
    }

    return option;
  }

  public async create(
    productId: number,
    businessId: number,
    data: {
      option_type?: string | null;
      option_value?: string | null;
      extra_price?: number;
    }
  ) {
    // Verificar que el producto pertenezca al business
    const product = await Product.findOne({
      where: {
        id: productId,
        business_id: businessId,
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const option = await ProductOption.create({
      product_id: productId,
      option_type: data.option_type || null,
      option_value: data.option_value || null,
      extra_price: data.extra_price || 0,
    });

    return option.reload();
  }

  public async update(
    id: number,
    businessId: number,
    data: {
      option_type?: string | null;
      option_value?: string | null;
      extra_price?: number;
    }
  ) {
    const option = await this.findById(id, businessId);

    await option.update(data);
    return option.reload();
  }

  public async delete(id: number, businessId: number) {
    const option = await this.findById(id, businessId);
    await option.destroy();
  }
}

export const productOptionRepository = new ProductOptionRepository();

