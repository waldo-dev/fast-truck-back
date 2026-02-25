import { AppError } from '../../shared/errors';
import { UserRole, ProductStatus } from '../../shared/database/models/enums';
import { productRepository } from './product.repository';
import { ProductBusiness, UserBusiness } from '../../shared/database/models';

export class ProductService {
  public async bulkCreate(
    businessIds: number[],
    data: {
      name: string;
      description?: string | null;
      price: number;
      category_id?: number | null;
      image_url?: string | null;
      status?: ProductStatus;
      options?: Array<{
        option_type?: string | null;
        option_value?: string | null;
        extra_price?: number;
      }>;
    },
    userRole: UserRole,
    userId: number
  ) {
    if (![UserRole.ADMIN, UserRole.BUSINESS_OWNER].includes(userRole)) {
      throw new AppError('Only ADMIN or BUSINESS_OWNER can create products', 403);
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

    const results: Array<{ business_id: number; product?: any; error?: string }> = [];

    for (const businessId of uniqueBusinessIds) {
      try {
        const normalizedStatus =
          typeof data.status === 'string'
            ? ((data.status as string).toUpperCase() as ProductStatus)
            : data.status;

        const product = await productRepository.create({
          ...data,
          status: normalizedStatus,
          business_id: businessId,
        });

        // Asociar producto al negocio para el owner (si aún no existe)
        await ProductBusiness.findOrCreate({
          where: { user_id: userId, business_id: businessId },
          defaults: { user_id: userId, business_id: businessId },
        });

        results.push({ business_id: businessId, product });
      } catch (err: any) {
        results.push({
          business_id: businessId,
          error: err?.message || 'Unexpected error',
        });
      }
    }

    return results;
  }

  public async getAllProducts(businessId: number, filters?: { category_id?: number; status?: ProductStatus }) {
    const products = await productRepository.findAll(businessId, filters);
    return products;
  }

  public async getProductsByOwner(
    userId: number,
    userRole: UserRole,
    filters?: { category_id?: number; status?: ProductStatus },
    businessId?: number
  ) {
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

    const products = await productRepository.findAllByBusinessIds(targetBusinessIds, filters);
    return products;
  }

  public async getProductById(id: number, businessId: number) {
    const product = await productRepository.findById(id, businessId);
    return product;
  }

  public async createProduct(
    data: {
      name: string;
      description?: string | null;
      price: number;
      category_id?: number | null;
      image_url?: string | null;
      status?: ProductStatus;
      options?: Array<{
        option_type?: string | null;
        option_value?: string | null;
        extra_price?: number;
      }>;
    },
    businessId: number,
    userRole: UserRole,
    userId: number
  ) {
    // Solo ADMIN puede crear productos
    if (userRole !== UserRole.ADMIN) {
      throw new AppError('Only ADMIN can create products', 403);
    }

    const product = await productRepository.create({
      ...data,
      business_id: businessId,
    });

    // Asociar producto al negocio para el owner (si aún no existe)
    await ProductBusiness.findOrCreate({
      where: { user_id: userId, business_id: businessId },
      defaults: { user_id: userId, business_id: businessId },
    });

    return product;
  }

  public async updateProduct(
    id: number,
    businessId: number,
    data: {
      name?: string;
      description?: string | null;
      price?: number;
      category_id?: number | null;
      image_url?: string | null;
      status?: ProductStatus;
      options?: Array<{
        id?: number;
        option_type?: string | null;
        option_value?: string | null;
        extra_price?: number;
      }>;
    },
    userRole: UserRole
  ) {
    // Solo ADMIN puede actualizar productos
    if (userRole !== UserRole.ADMIN) {
      throw new AppError('Only ADMIN can update products', 403);
    }

    const product = await productRepository.update(id, businessId, data);
    return product;
  }

  public async updateProductImage(id: number, businessId: number, imageUrl: string) {
    const product = await productRepository.update(id, businessId, { image_url: imageUrl });
    return product;
  }

  public async toggleProductStatus(
    id: number,
    businessId: number,
    status: ProductStatus,
    userRole: UserRole
  ) {
    // Solo ADMIN puede activar/desactivar productos
    if (userRole !== UserRole.ADMIN) {
      throw new AppError('Only ADMIN can toggle product status', 403);
    }

    const product = await productRepository.toggleStatus(id, businessId, status);
    return product;
  }

  public async deleteProduct(id: number, businessId: number, userRole: UserRole) {
    // Solo ADMIN puede eliminar productos
    if (userRole !== UserRole.ADMIN) {
      throw new AppError('Only ADMIN can delete products', 403);
    }

    await productRepository.delete(id, businessId);
  }
}

export const productService = new ProductService();


