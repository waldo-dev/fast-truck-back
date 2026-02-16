import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';
import { businessService } from './business.service';

export class BusinessController {
  public getAll = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id) {
        res.status(403).json({
          success: false,
          error: {
            message: 'User is not associated with a business',
          },
        });
        return;
      }

      const businesses = await businessService.getAllBusinesses(req.business_id);

      res.status(200).json({
        success: true,
        data: businesses,
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
            message: 'User is not associated with a business',
          },
        });
        return;
      }

      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid business ID',
          },
        });
        return;
      }

      const business = await businessService.getBusinessById(id, req.business_id);

      res.status(200).json({
        success: true,
        data: business,
      });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            message: 'Unauthorized',
          },
        });
        return;
      }

      const { name, brand_name, logo_url, primary_color, secondary_color } = req.body;

      if (!name) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Name is required',
          },
        });
        return;
      }

      const business = await businessService.createBusiness(
        {
          name,
          brand_name: brand_name || null,
          logo_url: logo_url || null,
          primary_color: primary_color || null,
          secondary_color: secondary_color || null,
        },
        req.user.role as UserRole
      );

      res.status(201).json({
        success: true,
        data: business,
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
            message: 'User is not associated with a business',
          },
        });
        return;
      }

      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid business ID',
          },
        });
        return;
      }

      const { name, brand_name, logo_url, primary_color, secondary_color } = req.body;

      const business = await businessService.updateBusiness(
        id,
        req.business_id,
        {
          name,
          brand_name,
          logo_url,
          primary_color,
          secondary_color,
        },
        req.user.role as UserRole
      );

      res.status(200).json({
        success: true,
        data: business,
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
            message: 'User is not associated with a business',
          },
        });
        return;
      }

      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid business ID',
          },
        });
        return;
      }

      await businessService.deleteBusiness(id, req.business_id, req.user.role as UserRole);

      res.status(200).json({
        success: true,
        message: 'Business deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

export const businessController = new BusinessController();

