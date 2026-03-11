import { Op } from 'sequelize';
import { Product, ProductOption, Category, Business } from '../../shared/database/models';
import { AppError } from '../../shared/errors';
import { ProductStatus } from '../../shared/database/models/enums';

export class ProductRepository {
  public async findAllByBusinessIds(
    businessIds: number[],
    filters?: { category_id?: number; status?: ProductStatus }
  ) {
    const where: any = {
      business_id: {
        [Op.in]: businessIds,
      },
      status: filters?.status || ProductStatus.ACTIVE,
    };

    if (filters?.category_id) {
      where.category_id = filters.category_id;
    }

    const products = await Product.findAll({
      where,
      include: [
        {
          model: Business,
          as: 'business',
          attributes: ['id', 'name'],
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
        },
        {
          model: ProductOption,
          as: 'options',
          attributes: ['id', 'option_type', 'option_value', 'extra_price'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    return products;
  }

  public async findAll(businessId: number, filters?: { category_id?: number; status?: ProductStatus }) {
    const where: any = {
      business_id: businessId,
      status: filters?.status || ProductStatus.ACTIVE,
    };

    if (filters?.category_id) {
      where.category_id = filters.category_id;
    }

    const products = await Product.findAll({
      where,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
        },
        {
          model: ProductOption,
          as: 'options',
          attributes: ['id', 'option_type', 'option_value', 'extra_price'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    return products;
  }

  public async findById(id: number) {
    const product = await Product.findOne({
      where: {
        id,
      },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
        },
        {
          model: ProductOption,
          as: 'options',
          attributes: ['id', 'option_type', 'option_value', 'extra_price'],
        },
      ],
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return product;
  }

  public async create(data: {
    business_id: number;
    name: string;
    description?: string | null;
    price: number;
    category_id?: number | null;
    image_url?: string | null;
    status?: ProductStatus;
    sku?: string | null;
    options?: Array<{
      option_type?: string | null;
      option_value?: string | null;
      extra_price?: number;
    }>;
  }) {
    const { options, ...productData } = data;

    let product;
    try {
      product = await Product.create(productData);
    } catch (err: any) {
      throw new AppError(err?.message || 'Failed to create product', 400);
    }

    // Crear opciones si se proporcionan
    if (options && options.length > 0) {
      await ProductOption.bulkCreate(
        options.map((option) => ({
          product_id: product.id,
          option_type: option.option_type || null,
          option_value: option.option_value || null,
          extra_price: option.extra_price || 0,
        }))
      );
    }

    return this.findById(product.id);
  }

  public async update(
    id: number,
    data: {
      name?: string;
      description?: string | null;
      price?: number;
      category_id?: number | null;
      image_url?: string | null;
      status?: ProductStatus;
      sku?: string | null;
      options?: Array<{
        id?: number;
        option_type?: string | null;
        option_value?: string | null;
        extra_price?: number;
      }>;
    }
  ) {
    const product = await this.findById(id);

    const { options, ...productData } = data;

    await product.update(productData);

    // Actualizar opciones si se proporcionan
    if (options) {
      // Obtener IDs de opciones existentes
      const existingOptions = await ProductOption.findAll({
        where: { product_id: id },
        attributes: ['id'],
      });
      const existingOptionIds = existingOptions.map((opt) => opt.id);

      // IDs de opciones que vienen en el request
      const incomingOptionIds = options.filter((opt) => opt.id).map((opt) => opt.id!);

      // Eliminar opciones que no están en el request
      const optionsToDelete = existingOptionIds.filter((id) => !incomingOptionIds.includes(id));
      if (optionsToDelete.length > 0) {
        await ProductOption.destroy({
          where: {
            id: { [Op.in]: optionsToDelete },
            product_id: id,
          },
        });
      }

      // Actualizar o crear opciones
      for (const option of options) {
        if (option.id) {
          // Actualizar opción existente
          await ProductOption.update(
            {
              option_type: option.option_type,
              option_value: option.option_value,
              extra_price: option.extra_price || 0,
            },
            {
              where: {
                id: option.id,
                product_id: id,
              },
            }
          );
        } else {
          // Crear nueva opción
          await ProductOption.create({
            product_id: id,
            option_type: option.option_type || null,
            option_value: option.option_value || null,
            extra_price: option.extra_price || 0,
          });
        }
      }
    }

    return this.findById(id);
  }

  public async toggleStatus(id: number, status: ProductStatus) {
    const product = await this.findById(id);
    await product.update({ status });
    return product.reload();
  }

  public async delete(id: number) {
    const product = await this.findById(id);
    await product.destroy();
  }
}

export const productRepository = new ProductRepository();


