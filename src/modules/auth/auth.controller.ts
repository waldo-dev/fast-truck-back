import { Response, NextFunction } from 'express';
import { ParsedQs } from 'qs';
import { AuthRequest } from '../../shared/middlewares';
import { authService } from './auth.service';

type BusinessIdQueryValue = undefined | null | string | ParsedQs | Array<string | ParsedQs>;

const resolveBusinessIdFromQuery = (value: BusinessIdQueryValue): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return resolveBusinessIdFromQuery(value[0]);
  }

  if (typeof value === 'string') {
    return value;
  }

  return undefined;
};

export class AuthController {
  public login = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const businessIdFromQuery = resolveBusinessIdFromQuery(req.query.business_id);

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Email and password are required',
          },
        });
        return;
      }

      const result = await authService.login({ email, password }, businessIdFromQuery);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

      const businessIdFromQuery = resolveBusinessIdFromQuery(req.query.business_id);
      const user = await authService.getCurrentUser(req.user.id, businessIdFromQuery);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  public refresh = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refresh_token } = req.body || {};
      const businessIdFromQuery = resolveBusinessIdFromQuery(req.query.business_id);
      if (!refresh_token) {
        res.status(400).json({
          success: false,
          error: {
            message: 'refresh_token is required',
          },
        });
        return;
      }

      const result = await authService.refresh(refresh_token, businessIdFromQuery);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();


