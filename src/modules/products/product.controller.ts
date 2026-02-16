import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/middlewares';
import { UserRole, ProductStatus } from '../../shared/database/models/enums';
import { productService } from './product.service';

export class ProductController {
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

  public create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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
        req.user.role as UserRole
      );

      res.status(201).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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
        req.user.role as UserRole
      );

      res.status(200).json({
        success: true,
        data: product,
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
        req.user.role as UserRole
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

      await productService.deleteProduct(id, req.business_id, req.user.role as UserRole);

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

