import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/middlewares';
import { authService } from './auth.service';

export class AuthController {
  public login = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Email and password are required',
          },
        });
        return;
      }

      const result = await authService.login({ email, password });

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

      const user = await authService.getCurrentUser(req.user.id);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();


