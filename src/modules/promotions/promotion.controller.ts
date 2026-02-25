import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';
import { promotionService } from './promotion.service';

export class PromotionController {
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

      const active = req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined;

      const filters: { active?: boolean } = {};
      if (active !== undefined) {
        filters.active = active;
      }

      const promotions = await promotionService.getAllPromotions(req.business_id, filters);

      res.status(200).json({
        success: true,
        data: promotions,
      });
    } catch (error) {
      next(error);
    }
  };

  public getByBusinessIds = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(403).json({
          success: false,
          error: { message: 'User is required' },
        });
        return;
      }

      const businessIdsParam = req.query.business_ids;
      let businessIds: number[] | undefined;

      if (typeof businessIdsParam === 'string') {
        businessIds = businessIdsParam
          .split(',')
          .map((v) => parseInt(v.trim(), 10))
          .filter((n) => !isNaN(n));
      } else if (Array.isArray(businessIdsParam)) {
        businessIds = businessIdsParam
          .map((v) => (typeof v === 'string' ? parseInt(v, 10) : Number(v)))
          .filter((n) => !isNaN(n));
      }

      const active = req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined;
      const promotions = await promotionService.getPromotionsByBusinessIds(
        req.user.id,
        req.user.role as UserRole,
        businessIds,
        req.business_id,
        { active }
      );

      res.status(200).json({
        success: true,
        data: promotions,
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
            message: 'Invalid promotion ID',
          },
        });
        return;
      }

      const promotion = await promotionService.getPromotionById(id, req.business_id);

      res.status(200).json({
        success: true,
        data: promotion,
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

      const {
        name,
        description,
        discount_type,
        discount_value,
        start_date,
        end_date,
        active,
        product_ids,
        business_ids,
      } = req.body;

      const promotion = await promotionService.createPromotion(
        {
          name,
          description,
          discount_type,
          discount_value,
          start_date,
          end_date,
          active,
          product_ids,
          business_ids,
        },
        req.business_id,
        req.user.role as UserRole,
        req.user.id
      );

      res.status(201).json({
        success: true,
        data: promotion,
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
            message: 'Invalid promotion ID',
          },
        });
        return;
      }

      const {
        name,
        description,
        discount_type,
        discount_value,
        start_date,
        end_date,
        active,
        product_ids,
        business_ids,
      } = req.body;

      const promotion = await promotionService.updatePromotion(
        id,
        req.business_id,
        {
          name,
          description,
          discount_type,
          discount_value,
          start_date,
          end_date,
          active,
          product_ids,
          business_ids,
        },
        req.user.role as UserRole,
        req.user.id
      );

      res.status(200).json({
        success: true,
        data: promotion,
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
            message: 'Invalid promotion ID',
          },
        });
        return;
      }

      const { active } = req.body;

      if (typeof active !== 'boolean') {
        res.status(400).json({
          success: false,
          error: {
            message: 'Active must be a boolean',
          },
        });
        return;
      }

      const promotion = await promotionService.togglePromotionStatus(
        id,
        req.business_id,
        active,
        req.user.role as UserRole
      );

      res.status(200).json({
        success: true,
        data: promotion,
      });
    } catch (error) {
      next(error);
    }
  };

  public addProducts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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
            message: 'Invalid promotion ID',
          },
        });
        return;
      }

      const { product_ids } = req.body;

      if (!Array.isArray(product_ids) || product_ids.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Product IDs array is required',
          },
        });
        return;
      }

      const promotion = await promotionService.addProductsToPromotion(
        id,
        req.business_id,
        product_ids,
        req.user.role as UserRole
      );

      res.status(200).json({
        success: true,
        data: promotion,
      });
    } catch (error) {
      next(error);
    }
  };

  public removeProducts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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
            message: 'Invalid promotion ID',
          },
        });
        return;
      }

      const { product_ids } = req.body;

      if (!Array.isArray(product_ids) || product_ids.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Product IDs array is required',
          },
        });
        return;
      }

      const promotion = await promotionService.removeProductsFromPromotion(
        id,
        req.business_id,
        product_ids,
        req.user.role as UserRole
      );

      res.status(200).json({
        success: true,
        data: promotion,
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
            message: 'Invalid promotion ID',
          },
        });
        return;
      }

      await promotionService.deletePromotion(id, req.business_id, req.user.role as UserRole);

      res.status(200).json({
        success: true,
        message: 'Promotion deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

export const promotionController = new PromotionController();


