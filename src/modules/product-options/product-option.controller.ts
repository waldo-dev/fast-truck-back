import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';
import { productOptionService } from './product-option.service';

export class ProductOptionController {
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
            message: 'Invalid product option ID',
          },
        });
        return;
      }

      const option = await productOptionService.getProductOptionById(id, req.business_id);

      res.status(200).json({
        success: true,
        data: option,
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

      const productId = parseInt(req.params.id, 10);

      if (isNaN(productId)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid product ID',
          },
        });
        return;
      }

      const { option_type, option_value, extra_price } = req.body;

      const option = await productOptionService.createProductOption(
        productId,
        req.business_id,
        {
          option_type,
          option_value,
          extra_price,
        },
        req.user.role as UserRole
      );

      res.status(201).json({
        success: true,
        data: option,
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
            message: 'Invalid product option ID',
          },
        });
        return;
      }

      const { option_type, option_value, extra_price } = req.body;

      const option = await productOptionService.updateProductOption(
        id,
        req.business_id,
        {
          option_type,
          option_value,
          extra_price,
        },
        req.user.role as UserRole
      );

      res.status(200).json({
        success: true,
        data: option,
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
            message: 'Invalid product option ID',
          },
        });
        return;
      }

      await productOptionService.deleteProductOption(id, req.business_id, req.user.role as UserRole);

      res.status(200).json({
        success: true,
        message: 'Product option deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

export const productOptionController = new ProductOptionController();

