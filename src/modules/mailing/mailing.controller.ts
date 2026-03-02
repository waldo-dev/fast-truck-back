import { Response, NextFunction } from 'express';
import { AuthRequest, validate } from '../../shared/middlewares';
import { createCampaignSchema, sendMailSchema } from './mailing.schemas';
import { mailingService } from './mailing.service';

export class MailingController {
  public getDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id || !req.user) {
        res.status(403).json({
          success: false,
          error: { message: 'Business ID and user are required' },
        });
        return;
      }

      const data = await mailingService.getDashboard(req.business_id);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  public listCampaigns = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id || !req.user) {
        res.status(403).json({
          success: false,
          error: { message: 'Business ID and user are required' },
        });
        return;
      }

      const data = await mailingService.listCampaigns(req.business_id);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  public createCampaign = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id || !req.user) {
        res.status(403).json({
          success: false,
          error: { message: 'Business ID and user are required' },
        });
        return;
      }

      const parse = createCampaignSchema.safeParse(req.body);
      if (!parse.success) {
        res.status(400).json({
          success: false,
          error: { message: parse.error.errors.map((e) => e.message).join(', ') },
        });
        return;
      }

      const data = await mailingService.createCampaign(req.business_id, parse.data);

      res.status(201).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  public sendBulk = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id || !req.user) {
        res.status(403).json({
          success: false,
          error: { message: 'Business ID and user are required' },
        });
        return;
      }

      const parse = sendMailSchema.safeParse(req.body);
      if (!parse.success) {
        res.status(400).json({
          success: false,
          error: { message: parse.error.errors.map((e) => e.message).join(', ') },
        });
        return;
      }

      const result = await mailingService.sendBulk(parse.data);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const mailingController = new MailingController();


