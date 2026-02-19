import { Request, Response, NextFunction } from 'express';
import { healthService } from './health.service';

export class HealthController {
  public getHealth = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const healthStatus = await healthService.getHealthStatus();
      res.status(200).json(healthStatus);
    } catch (error) {
      next(error);
    }
  };
}

export const healthController = new HealthController();

