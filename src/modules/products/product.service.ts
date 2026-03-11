import { AppError } from '../../shared/errors';
import { UserRole, ProductStatus } from '../../shared/database/models/enums';
import { productRepository } from './product.repository';
import { UserBusiness } from '../../shared/database/models';

export class ProductService {
  private generateSku() {
    const timePart = Date.now().toString(36).toUpperCase();
    const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `SKU-${timePart}-${randomPart}`;
  }

  private async ensureOwnerAccess(userRole: UserRole, userId: number | undefined, businessId: number) {
    if (userRole !== UserRole.BUSINESS_OWNER) return;
    if (!userId) {
      throw new AppError('User ID is required', 400);
    }
    const link = await UserBusiness.findOne({
      where: { user_id: userId, business_id: businessId },
      attributes: ['business_id'],
    });
    if (!link) {
      throw new AppError('Business not associated to this owner', 403);
    }
  }
  public async bulkCreate(
    businessIds: number[],
    data: {
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

        const sku = data.sku && data.sku.trim().length > 0 ? data.sku.trim() : this.generateSku();

        const product = await productRepository.create({
          ...data,
          status: normalizedStatus,
          sku,
          business_id: businessId,
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
    if (![UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR].includes(userRole)) {
      throw new AppError('Only BUSINESS_OWNER or LOCAL_OPERATOR can access this resource', 403);
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
        throw new AppError('Business not associated to this user', 403);
      }
      targetBusinessIds = [businessId];
    }

    const products = await productRepository.findAllByBusinessIds(targetBusinessIds, filters);
    return products;
  }

  public async getProductById(id: number) {
    const product = await productRepository.findById(id);
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
      sku?: string | null;
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
    // ADMIN o BUSINESS_OWNER
    if (![UserRole.ADMIN, UserRole.BUSINESS_OWNER].includes(userRole)) {
      throw new AppError('Only ADMIN or BUSINESS_OWNER can create products', 403);
    }

    await this.ensureOwnerAccess(userRole, userId, businessId);

    const normalizedStatus =
      typeof data.status === 'string'
        ? ((data.status as string).toUpperCase() as ProductStatus)
        : data.status;

    const sku = data.sku && data.sku.trim().length > 0 ? data.sku.trim() : this.generateSku();

    const product = await productRepository.create({
      ...data,
      status: normalizedStatus,
      sku,
      business_id: businessId,
    });

    return product;
  }

  public async updateProduct(
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
    },
    userRole: UserRole,
    userId: number
  ) {
    const current = await productRepository.findById(id);
    if (!current.business_id) {
      throw new AppError('Business ID is required for this product', 400);
    }
    await this.ensureOwnerAccess(userRole, userId, current.business_id);

    const normalizedStatus =
      data.status && typeof data.status === 'string'
        ? ((data.status as string).toUpperCase() as ProductStatus)
        : data.status;

    let nextSku: string | undefined;
    console.log("🚀 ~ ProductService ~ updateProduct ~ data:", data)
    if (data.sku === undefined || data.sku === null || data.sku.trim().length === 0) {
      // Si no viene SKU y el producto no tiene, generar uno nuevo
      if (!current.sku) {
        nextSku = this.generateSku();
      }
    } else {
      nextSku = data.sku.trim();
    }

    const product = await productRepository.update(id, {
      ...data,
      ...(normalizedStatus ? { status: normalizedStatus } : {}),
      ...(nextSku !== undefined ? { sku: nextSku } : {}),
    });
    return product;
  }

  public async updateProductImage(id: number, imageUrl: string) {
    await productRepository.update(id, { image_url: imageUrl });
    // Traerlo nuevamente con asociaciones y campos actualizados (incluido image_url)
    const product = await productRepository.findById(id);
    return product;
  }

  public async importProductsFromCsv(
    csvContent: string,
    userRole: UserRole,
    userId: number
  ): Promise<Array<{ row: number; product?: any; error?: string }>> {
    if (![UserRole.ADMIN, UserRole.BUSINESS_OWNER].includes(userRole)) {
      throw new AppError('Only ADMIN or BUSINESS_OWNER can import products', 403);
    }

    const lines = csvContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      throw new AppError('CSV is empty', 400);
    }

    const headerLine = lines[0];
    const delimiter = headerLine.includes(';') ? ';' : ',';
    const headers = headerLine.split(delimiter).map((h) => h.trim().toLowerCase());

    const expected = ['business_id', 'name', 'price', 'category_id', 'description', 'status', 'sku', 'image_url'];
    const missingHeaders = expected.filter((h) => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new AppError(`Missing headers: ${missingHeaders.join(', ')}`, 400);
    }

    const idx = (key: string) => headers.indexOf(key);
    const rows = lines.slice(1);
    const results: Array<{ row: number; product?: any; error?: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2; // considerando header en línea 1
      const raw = rows[i];
      if (!raw) continue;
      const cols = raw.split(delimiter);

      const rawBusinessId = cols[idx('business_id')]?.trim();
      const rawName = cols[idx('name')]?.trim();
      const rawPrice = cols[idx('price')]?.trim();
      const rawCategoryId = cols[idx('category_id')]?.trim();
      const rawDescription = cols[idx('description')]?.trim();
      const rawStatus = cols[idx('status')]?.trim();
      const rawSku = cols[idx('sku')]?.trim();
      const rawImageUrl = cols[idx('image_url')]?.trim();

      const businessId = rawBusinessId ? parseInt(rawBusinessId, 10) : NaN;
      const price = rawPrice ? parseInt(rawPrice, 10) : NaN;
      const categoryId = rawCategoryId ? parseInt(rawCategoryId, 10) : undefined;

      const status =
        rawStatus && Object.values(ProductStatus).includes(rawStatus.toUpperCase() as ProductStatus)
          ? (rawStatus.toUpperCase() as ProductStatus)
          : ProductStatus.ACTIVE;

      try {
        if (!rawBusinessId || isNaN(businessId)) {
          throw new Error('business_id is required and must be a number');
        }
        if (!rawName) {
          throw new Error('name is required');
        }
        if (!rawPrice || isNaN(price)) {
          throw new Error('price is required and must be a number');
        }

        // Validar pertenencia para OWNER
        await this.ensureOwnerAccess(userRole, userId, businessId);

        const product = await productRepository.create({
          business_id: businessId,
          name: rawName,
          description: rawDescription || null,
          price,
          category_id: categoryId || null,
          image_url: rawImageUrl || null,
          status,
          sku: rawSku && rawSku.length > 0 ? rawSku : this.generateSku(),
          options: [],
        });

        results.push({ row: rowNumber, product });
      } catch (err: any) {
        results.push({ row: rowNumber, error: err?.message || 'Unexpected error' });
      }
    }

    return results;
  }

  public async toggleProductStatus(
    id: number,
    businessId: number,
    status: ProductStatus,
    userRole: UserRole,
    userId: number
  ) {
    if (![UserRole.ADMIN, UserRole.BUSINESS_OWNER].includes(userRole)) {
      throw new AppError('Only ADMIN or BUSINESS_OWNER can toggle product status', 403);
    }

    await this.ensureOwnerAccess(userRole, userId, businessId);

    const product = await productRepository.toggleStatus(id, status);
    return product;
  }

  public async deleteProduct(id: number, businessId: number, userRole: UserRole, userId: number) {
    if (![UserRole.ADMIN, UserRole.BUSINESS_OWNER].includes(userRole)) {
      throw new AppError('Only ADMIN or BUSINESS_OWNER can delete products', 403);
    }

    await this.ensureOwnerAccess(userRole, userId, businessId);

    await productRepository.delete(id);
  }
}

export const productService = new ProductService();


