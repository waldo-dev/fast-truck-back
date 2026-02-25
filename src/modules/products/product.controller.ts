import { Response, NextFunction } from 'express';
import { bucket } from '../../config/firebase';
import { AuthRequest } from '../../shared/middlewares';
import { UserRole, ProductStatus } from '../../shared/database/models/enums';
import { productService } from './product.service';

type FileAuthRequest = AuthRequest & { file?: Express.Multer.File };

export class ProductController {
  private async uploadImageToBucket(file: Express.Multer.File, businessId: number, productId: number): Promise<string> {
    const objectName = `business/${businessId}/products/${productId}/${Date.now()}-${file.originalname}`;
    const fileRef = bucket.file(objectName);

    await fileRef.save(file.buffer, {
      metadata: { contentType: file.mimetype },
      public: true,
      resumable: false,
    });

    return fileRef.publicUrl();
  }

  public bulkCreate = async (req: FileAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(403).json({
          success: false,
          error: { message: 'User is required' },
        });
        return;
      }

      const file = req.file;

      const body = req.body as any;
      console.log('🚀 ~ ProductController ~ body:', body);

      // Normalizar business_ids (string "[6,7]" | "6,7" | array | business_ids[])
      let business_ids: number[] = [];

      if (Array.isArray(body.business_ids)) {
        business_ids = body.business_ids;
      } else if (Array.isArray(body['business_ids[]'])) {
        business_ids = body['business_ids[]'];
      } else {
        // keys como business_ids[0], business_ids[1], ...
        const indexed = Object.entries(body)
          .filter(([k]) => k.startsWith('business_ids['))
          .map(([, v]) => v);
        if (indexed.length > 0) {
          business_ids = indexed as any[];
        } else if (typeof body.business_ids === 'string') {
          try {
            const parsed = JSON.parse(body.business_ids);
            if (Array.isArray(parsed)) {
              business_ids = parsed;
            }
          } catch (_) {
            business_ids = body.business_ids
              .split(',')
              .map((v: string) => v.trim())
              .filter((v: string) => v !== '')
              .map((v: string) => Number(v));
          }
        }
      }

      business_ids = business_ids
        .map((v: any) => Number(v))
        .filter((v) => !Number.isNaN(v));

      if (business_ids.length === 0) {
        res.status(400).json({
          success: false,
          error: { message: 'business_ids is required' },
        });
        return;
      }

      // Soporta formato con data o plano
      const data =
        body.data && typeof body.data === 'object'
          ? body.data
          : {
              name: body.name,
              description: body.description,
              price: body.price,
              category_id: body.category_id,
              image_url: body.image_url,
              status: body.status,
              options: body.options,
            };

      const result = await productService.bulkCreate(
        business_ids,
        data,
        req.user.role as UserRole,
        req.user.id
      );

      // Si hay archivo, subir por cada producto creado
      if (file) {
        for (const item of result) {
          if (item.product && item.product.id && item.business_id) {
            try {
              const imageUrl = await this.uploadImageToBucket(file, item.business_id, item.product.id);
              item.product = await productService.updateProductImage(item.product.id, item.business_id, imageUrl);
            } catch (err) {
              item.error = `Image upload failed: ${(err as any)?.message || 'unknown error'}`;
            }
          }
        }
      }

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getByOwner = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(403).json({
          success: false,
          error: {
            message: 'User is required',
          },
        });
        return;
      }

      const categoryId = req.query.category_id ? parseInt(req.query.category_id as string, 10) : undefined;
      const businessId = req.query.business_id ? parseInt(req.query.business_id as string, 10) : undefined;
      const status = req.query.status as ProductStatus | undefined;

      const filters: { category_id?: number; status?: ProductStatus } = {};
      if (categoryId && !isNaN(categoryId)) {
        filters.category_id = categoryId;
      }
      if (status && Object.values(ProductStatus).includes(status)) {
        filters.status = status;
      }

      const products = await productService.getProductsByOwner(
        req.user.id,
        req.user.role as UserRole,
        filters,
        businessId && !isNaN(businessId) ? businessId : undefined
      );

      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  };

  public getAll = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Business ID is required',
          },
        });
        return;
      }

      const categoryId = req.query.category_id ? parseInt(req.query.category_id as string, 10) : undefined;
      const status = req.query.status as ProductStatus | undefined;

      const filters: { category_id?: number; status?: ProductStatus } = {};
      if (categoryId && !isNaN(categoryId)) {
        filters.category_id = categoryId;
      }
      if (status && Object.values(ProductStatus).includes(status)) {
        filters.status = status;
      }

      const products = await productService.getAllProducts(req.business_id, filters);

      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Business ID is required',
          },
        });
        return;
      }

      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid product ID',
          },
        });
        return;
      }

      const product = await productService.getProductById(id, req.business_id);

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: FileAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id || !req.user) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Business ID and user are required',
          },
        });
        return;
      }

      const file = req.file;

      const { name, description, price, category_id, image_url, status, options } = req.body;

      const product = await productService.createProduct(
        {
          name,
          description,
          price,
          category_id,
          image_url,
          status,
          options,
        },
        req.business_id,
        req.user.role as UserRole,
        req.user.id
      );

      let productWithImage = product;

      if (file) {
        const imageUrl = await this.uploadImageToBucket(file, req.business_id, product.id);
        productWithImage = await productService.updateProductImage(product.id, req.business_id, imageUrl);
      }

      res.status(201).json({
        success: true,
        data: productWithImage,
      });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: FileAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id || !req.user) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Business ID and user are required',
          },
        });
        return;
      }

      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid product ID',
          },
        });
        return;
      }

      const file = req.file;

      const { name, description, price, category_id, image_url, status, options } = req.body;

      const product = await productService.updateProduct(
        id,
        req.business_id,
        {
          name,
          description,
          price,
          category_id,
          image_url,
          status,
          options,
        },
        req.user.role as UserRole,
        req.user.id
      );

      let productWithImage = product;

      if (file) {
        const imageUrl = await this.uploadImageToBucket(file, req.business_id, id);
        productWithImage = await productService.updateProductImage(id, req.business_id, imageUrl);
      }

      res.status(200).json({
        success: true,
        data: productWithImage,
      });
    } catch (error) {
      next(error);
    }
  };

  public toggleStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id || !req.user) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Business ID and user are required',
          },
        });
        return;
      }

      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid product ID',
          },
        });
        return;
      }

      const { status } = req.body;

      if (!status || !Object.values(ProductStatus).includes(status)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid status. Must be ACTIVE or INACTIVE',
          },
        });
        return;
      }

      const product = await productService.toggleProductStatus(
        id,
        req.business_id,
        status,
        req.user.role as UserRole,
        req.user.id
      );

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id || !req.user) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Business ID and user are required',
          },
        });
        return;
      }

      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid product ID',
          },
        });
        return;
      }

      await productService.deleteProduct(id, req.business_id, req.user.role as UserRole, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

export const productController = new ProductController();


