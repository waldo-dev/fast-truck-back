import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';
import { paymentService } from './payment.service';

export class PaymentController {
  public getByOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

      const orderId = parseInt(req.params.orderId, 10);

      if (isNaN(orderId)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid order ID',
          },
        });
        return;
      }

      const payments = await paymentService.getPaymentsByOrder(orderId, req.business_id);

      res.status(200).json({
        success: true,
        data: payments,
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

      const { order_id, payment_method, amount } = req.body;

      const payment = await paymentService.createPayment(
        {
          order_id,
          payment_method,
          amount,
        },
        req.business_id,
        req.user.role as UserRole
      );

      res.status(201).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const paymentController = new PaymentController();

