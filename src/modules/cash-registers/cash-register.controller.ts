import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/middlewares';
import { cashRegisterService } from './cash-register.service';

export class CashRegisterController {
  public open = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        businessId,
        business_id,
        locationId,
        location_id,
        userId,
        opened_by,
        openingAmount,
        opening_amount,
        allowMultiple,
      } = req.body;
      const business = businessId ?? business_id;
      const location = locationId ?? location_id;
      const opening = openingAmount ?? opening_amount;
      const register = await cashRegisterService.openRegister({
        business_id: business !== undefined ? Number(business) : NaN,
        location_id: location !== undefined ? Number(location) : undefined,
        opened_by: opened_by ?? (userId ? String(userId) : req.user?.email || null),
        opening_amount: opening !== undefined ? Number(opening) : undefined,
        allowMultiple,
      });
      res.status(201).json({ success: true, data: register });
    } catch (error) {
      next(error);
    }
  };

  public close = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: { message: 'Invalid cash register ID' } });
        return;
      }
      const { closed_by, closing_amount, closingAmount, userId } = req.body;
      const register = await cashRegisterService.closeRegister(id, {
        closed_by: closed_by ?? (userId ? String(userId) : req.user?.email || null),
        closing_amount: closing_amount !== undefined ? Number(closing_amount) : closingAmount !== undefined ? Number(closingAmount) : undefined,
      });
      res.status(200).json({ success: true, data: register });
    } catch (error) {
      next(error);
    }
  };

  public getActive = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const businessId = req.query.business_id ? Number(req.query.business_id) : undefined;
      const locationId = req.query.location_id ? Number(req.query.location_id) : undefined;
      if (!businessId || Number.isNaN(businessId)) {
        res.status(400).json({ success: false, error: { message: 'business_id is required' } });
        return;
      }
      const register = await cashRegisterService.getActive(businessId, locationId);
      res.status(200).json({ success: true, data: register });
    } catch (error) {
      next(error);
    }
  };

  public addMovement = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cash_register_id = parseInt(req.params.id, 10);
      if (isNaN(cash_register_id)) {
        res.status(400).json({ success: false, error: { message: 'Invalid cash register ID' } });
        return;
      }
      const { type, amount, payment_method, order_id, notes } = req.body;
      const movement = await cashRegisterService.addMovement({
        cash_register_id: Number(cash_register_id),
        type,
        amount: amount !== undefined ? Number(amount) : undefined,
        payment_method,
        order_id: order_id !== undefined ? Number(order_id) : undefined,
        notes,
      });
      res.status(201).json({ success: true, data: movement });
    } catch (error) {
      next(error);
    }
  };

  public listMovements = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cashRegisterId = parseInt(req.params.id, 10);
      if (isNaN(cashRegisterId)) {
        res.status(400).json({ success: false, error: { message: 'Invalid cash register ID' } });
        return;
      }
      const movements = await cashRegisterService.listMovements(cashRegisterId);
      res.status(200).json({ success: true, data: movements });
    } catch (error) {
      next(error);
    }
  };

  public getHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const businessId = (req.query.business_id ?? req.query.businessId ?? req.business_id) as any;
      const locationId = (req.query.location_id ?? req.query.locationId) as any;
      const status = (req.query.status as string | undefined) ?? undefined;

      const business_id = businessId !== undefined ? Number(businessId) : NaN;
      const location_id = locationId !== undefined ? Number(locationId) : undefined;

      if (!business_id || Number.isNaN(business_id)) {
        res.status(400).json({ success: false, error: { message: 'business_id is required' } });
        return;
      }

      const history = await cashRegisterService.getHistory({
        business_id,
        location_id: location_id ?? null,
        status: status ?? null,
      });

      res.status(200).json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  };

  public getSummary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cashRegisterId = parseInt(req.params.id, 10);
      if (isNaN(cashRegisterId)) {
        res.status(400).json({ success: false, error: { message: 'Invalid cash register ID' } });
        return;
      }
      const summary = await cashRegisterService.getSummary(cashRegisterId);
      res.status(200).json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  };
}

export const cashRegisterController = new CashRegisterController();





