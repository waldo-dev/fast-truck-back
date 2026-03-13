import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/middlewares';
import { UserRole, SubscriptionStatus } from '../../shared/database/models/enums';
import { subscriptionService } from './subscription.service';

export class SubscriptionController {
  public getAll = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requestedBusinessId = req.query.business_id ? parseInt(req.query.business_id as string, 10) : undefined;
      const businessId = requestedBusinessId ?? req.business_id;

      if (!businessId || isNaN(businessId)) {
        res.status(403).json({ success: false, error: { message: 'Business ID is required' } });
        return;
      }

      const status = req.query.status as SubscriptionStatus | undefined;
      const plan_id = req.query.plan_id ? parseInt(req.query.plan_id as string, 10) : undefined;

      const filters: { status?: SubscriptionStatus; plan_id?: number } = {};
      if (status && Object.values(SubscriptionStatus).includes(status)) {
        filters.status = status;
      }
      if (plan_id && !isNaN(plan_id)) {
        filters.plan_id = plan_id;
      }

      const subscriptions = await subscriptionService.getAll(businessId, filters);
      res.status(200).json({ success: true, data: subscriptions });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const businessId = req.business_id;
      if (!businessId) {
        res.status(403).json({ success: false, error: { message: 'Business ID is required' } });
        return;
      }

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: { message: 'Invalid subscription ID' } });
        return;
      }

      const subscription = await subscriptionService.getById(id, businessId);
      res.status(200).json({ success: true, data: subscription });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id || !req.user) {
        res.status(403).json({ success: false, error: { message: 'Business ID and user are required' } });
        return;
      }

      const subscription = await subscriptionService.create(req.body, req.business_id, req.user.role as UserRole);
      res.status(201).json({ success: true, data: subscription });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id || !req.user) {
        res.status(403).json({ success: false, error: { message: 'Business ID and user are required' } });
        return;
      }

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: { message: 'Invalid subscription ID' } });
        return;
      }

      const subscription = await subscriptionService.update(
        id,
        req.business_id,
        req.body,
        req.user.role as UserRole
      );
      res.status(200).json({ success: true, data: subscription });
    } catch (error) {
      next(error);
    }
  };

  public addPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id || !req.user) {
        res.status(403).json({ success: false, error: { message: 'Business ID and user are required' } });
        return;
      }

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: { message: 'Invalid subscription ID' } });
        return;
      }

      const payment = await subscriptionService.addPayment(
        id,
        req.business_id,
        req.body,
        req.user.role as UserRole
      );
      res.status(201).json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  };
}

export const subscriptionController = new SubscriptionController();







