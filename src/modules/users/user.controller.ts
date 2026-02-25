import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';
import { userService } from './user.service';

export class UserController {
  public getByBusiness = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

      const businessId = parseInt(req.params.businessId, 10);

      if (isNaN(businessId)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid business ID',
          },
        });
        return;
      }

      const users = await userService.getUsersByBusiness(businessId, {
        id: req.user.id,
        role: req.user.role as UserRole,
        businessId: req.user.business_id,
      });

      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  };

  public getAdminsAndOwners = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

      if (businessId !== undefined && isNaN(businessId)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid business ID',
          },
        });
        return;
      }

      const users = await userService.getAdminsAndOwners(
        {
          id: req.user.id,
          role: req.user.role as UserRole,
          businessId: req.user.business_id,
        },
        businessId
      );

      res.status(200).json({
        success: true,
        data: users,
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

      const users = await userService.getAllUsers(req.business_id);

      res.status(200).json({
        success: true,
        data: users,
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
            message: 'Invalid user ID',
          },
        });
        return;
      }

      const user = await userService.getUserById(id, req.business_id);

      res.status(200).json({
        success: true,
        data: user,
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

      const { email, password, name, role, business_ids } = req.body as {
        email: string;
        password: string;
        name: string;
        role?: UserRole;
        business_ids?: number[];
      };

      const user = await userService.createUser(
        {
          email,
          password,
          name,
          role,
        },
        business_ids,
        {
          id: req.user.id,
          role: req.user.role as UserRole,
          businessId: req.business_id,
        }
      );

      res.status(201).json({
        success: true,
        data: user,
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
            message: 'Invalid user ID',
          },
        });
        return;
      }

      const { name, email, role, active, business_ids } = req.body as {
        name?: string;
        email?: string;
        role?: UserRole;
        active?: boolean;
        business_ids?: number[];
      };

      const user = await userService.updateUser(
        id,
        req.business_id,
        {
          name,
          email,
          role,
          active,
        },
        business_ids,
        {
          id: req.user.id,
          role: req.user.role as UserRole,
          businessId: req.business_id,
        }
      );

      res.status(200).json({
        success: true,
        data: user,
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
            message: 'Invalid user ID',
          },
        });
        return;
      }

      const user = await userService.deactivateUser(id, req.business_id, req.user.role as UserRole);

      res.status(200).json({
        success: true,
        data: user,
        message: 'User deactivated successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

export const userController = new UserController();


