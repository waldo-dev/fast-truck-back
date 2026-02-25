import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';
import { categoryService } from './category.service';

export class CategoryController {
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

      const businessId = req.query.business_id ? parseInt(req.query.business_id as string, 10) : undefined;

      const categories = await categoryService.getCategoriesByOwner(
        req.user.id,
        req.user.role as UserRole,
        businessId && !isNaN(businessId) ? businessId : undefined
      );
      console.log("🚀 ~ CategoryController ~ categories:", categories)

      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  };

  public bulkCreate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(403).json({
          success: false,
          error: { message: 'User is required' },
        });
        return;
      }

      const { business_ids, name } = req.body as { business_ids: number[]; name: string };

      const result = await categoryService.bulkCreate(
        business_ids,
        name,
        req.user.role as UserRole,
        req.user.id
      );

      res.status(201).json({
        success: true,
        data: result,
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

      const categories = await categoryService.getAllCategories(req.business_id);

      res.status(200).json({
        success: true,
        data: categories,
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
            message: 'Invalid category ID',
          },
        });
        return;
      }

      const category = await categoryService.getCategoryById(id, req.business_id);

      res.status(200).json({
        success: true,
        data: category,
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

      const { name } = req.body;

      const category = await categoryService.createCategory(
        { name },
        req.business_id,
        req.user.role as UserRole
      );

      res.status(201).json({
        success: true,
        data: category,
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
            message: 'Invalid category ID',
          },
        });
        return;
      }

      const { name } = req.body;

      const category = await categoryService.updateCategory(
        id,
        req.business_id,
        { name },
        req.user.role as UserRole
      );

      res.status(200).json({
        success: true,
        data: category,
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
            message: 'Invalid category ID',
          },
        });
        return;
      }

      await categoryService.deleteCategory(id, req.business_id, req.user.role as UserRole);

      res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

export const categoryController = new CategoryController();


