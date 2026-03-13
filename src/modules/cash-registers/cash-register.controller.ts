import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/middlewares';
import { cashRegisterService } from './cash-register.service';

export class CashRegisterController {
  public open = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { business_id, location_id, opened_by, opening_amount, allowMultiple } = req.body;
      const register = await cashRegisterService.openRegister({
        business_id: Number(business_id),
        location_id: location_id !== undefined ? Number(location_id) : undefined,
        opened_by: opened_by ?? (req.user?.email || null),
        opening_amount: opening_amount !== undefined ? Number(opening_amount) : undefined,
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
      const { closed_by, closing_amount } = req.body;
      const register = await cashRegisterService.closeRegister(id, {
        closed_by: closed_by ?? (req.user?.email || null),
        closing_amount: closing_amount !== undefined ? Number(closing_amount) : undefined,
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
      const { cash_register_id, type, amount, payment_method, order_id, opcional, notes } = req.body;
      const movement = await cashRegisterService.addMovement({
        cash_register_id: Number(cash_register_id),
        type,
        amount: amount !== undefined ? Number(amount) : undefined,
        payment_method,
        order_id: order_id !== undefined ? Number(order_id) : undefined,
        opcional,
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
}

export const cashRegisterController = new CashRegisterController();



