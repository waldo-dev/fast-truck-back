import { AppError } from '../../shared/errors';
import { UserRole, ProductStatus } from '../../shared/database/models/enums';
import { productRepository } from './product.repository';

export class ProductService {
  public async getAllProducts(businessId: number, filters?: { category_id?: number; status?: ProductStatus }) {
    const products = await productRepository.findAll(businessId, filters);
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
    userRole: UserRole
  ) {
    // Solo ADMIN puede crear productos
    if (userRole !== UserRole.ADMIN) {
      throw new AppError('Only ADMIN can create products', 403);
    }

    const product = await productRepository.create({
      ...data,
      business_id: businessId,
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


