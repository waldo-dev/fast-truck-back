import { AppError } from '../../shared/errors';
import { cashRegisterRepository } from './cash-register.repository';

export class CashRegisterService {
  public async openRegister(data: {
    business_id: number;
    location_id?: number | null;
    opened_by?: string | null;
    opening_amount?: number | null;
    allowMultiple?: boolean;
  }) {
    if (!data.allowMultiple) {
      const active = await cashRegisterRepository.findActive(data.business_id, data.location_id ?? undefined);
      if (active) {
        throw new AppError('There is already an open cash register for this business/location', 400);
      }
    }
    return cashRegisterRepository.createRegister(data);
  }

  public async closeRegister(id: number, data: { closed_by?: string | null; closing_amount?: number | null }) {
    return cashRegisterRepository.closeRegister(id, data);
  }

  public async getActive(business_id: number, location_id?: number | null) {
    return cashRegisterRepository.findActive(business_id, location_id ?? undefined);
  }

  public async addMovement(data: {
    cash_register_id: number;
    type?: string | null;
    amount?: number | null;
    payment_method?: string | null;
    order_id?: number | null;
    opcional?: string | null;
    notes?: string | null;
  }) {
    return cashRegisterRepository.addMovement(data);
  }

  public async listMovements(cash_register_id: number) {
    await cashRegisterRepository.getById(cash_register_id);
    return cashRegisterRepository.listMovements(cash_register_id);
  }
}

export const cashRegisterService = new CashRegisterService();



