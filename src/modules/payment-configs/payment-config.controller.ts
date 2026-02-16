import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';
import { paymentConfigService } from './payment-config.service';

export class PaymentConfigController {
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

      // Retornar configuración activa si existe
      const activeConfig = await paymentConfigService.getActiveConfig(req.business_id);

      res.status(200).json({
        success: true,
        data: activeConfig,
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

      const { provider, commerce_code, api_key, environment, active } = req.body;

      const config = await paymentConfigService.createPaymentConfig(
        {
          provider,
          commerce_code,
          api_key,
          environment,
          active,
        },
        req.business_id,
        req.user.role as UserRole
      );

      res.status(201).json({
        success: true,
        data: config,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const paymentConfigController = new PaymentConfigController();

