import { Response, NextFunction } from 'express';
import { planService } from './plan.service';
import { AuthRequest } from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';

export class PlanController {
  public getAll = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const activeParam = _req.query.active;
      const active = typeof activeParam === 'string' ? activeParam === 'true' : undefined;
      const plans = await planService.getAllPlans({ active });
      res.status(200).json({ success: true, data: plans });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: { message: 'Invalid plan ID' } });
        return;
      }
      const plan = await planService.getPlanById(id);
      res.status(200).json({ success: true, data: plan });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(403).json({ success: false, error: { message: 'User is required' } });
        return;
      }

      const plan = await planService.createPlan(req.body, req.user.role as UserRole);
      res.status(201).json({ success: true, data: plan });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(403).json({ success: false, error: { message: 'User is required' } });
        return;
      }

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: { message: 'Invalid plan ID' } });
        return;
      }

      const plan = await planService.updatePlan(id, req.body, req.user.role as UserRole);
      res.status(200).json({ success: true, data: plan });
    } catch (error) {
      next(error);
    }
  };
}

export const planController = new PlanController();







