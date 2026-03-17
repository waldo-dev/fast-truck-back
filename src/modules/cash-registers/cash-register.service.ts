import { AppError } from '../../shared/errors';
import { cashRegisterRepository } from './cash-register.repository';
import { PaymentMethod } from '../../shared/database/models/enums';

export class CashRegisterService {
  public async openRegister(data: {
    business_id: number;
    location_id?: number | null;
    opened_by?: string | null;
    opening_amount?: number | null;
    allowMultiple?: boolean;
  }) {
    if (!data.business_id || Number.isNaN(data.business_id)) {
      throw new AppError('Business ID is required', 400);
    }
    if (!data.allowMultiple) {
      const active = await cashRegisterRepository.findActive(data.business_id, data.location_id ?? undefined);
      if (active) {
        throw new AppError('There is already an open cash register for this business/location', 400);
      }
    }
    const nextCode = await cashRegisterRepository.getNextCodeForBusiness(data.business_id);
    return cashRegisterRepository.createRegister({
      ...data,
      code: nextCode,
    });
  }

  public async closeRegister(id: number, data: { closed_by?: string | null; closing_amount?: number | null }) {
    const { expectedCash } = await cashRegisterRepository.getSummaryData(id);
    const closingAmount = data.closing_amount ?? expectedCash;
    const register = await cashRegisterRepository.closeRegister(id, {
      closed_by: data.closed_by,
      closing_amount: closingAmount,
    });

    return {
      registerId: register.id,
      expectedCash,
      closingAmount,
      difference: Number(closingAmount || 0) - Number(expectedCash || 0),
    };
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
    notes?: string | null;
  }) {
    if (!data.cash_register_id || Number.isNaN(data.cash_register_id)) {
      throw new AppError('Cash register ID is required', 400);
    }
    if (!data.type) {
      throw new AppError('Movement type is required', 400);
    }
    if (!data.amount || Number(data.amount) <= 0) {
      throw new AppError('Amount must be greater than 0', 400);
    }

    return cashRegisterRepository.addMovement(data);
  }

  public async listMovements(cash_register_id: number) {
    await cashRegisterRepository.getById(cash_register_id);
    return cashRegisterRepository.listMovements(cash_register_id);
  }

  public async getHistory(params: { business_id: number; location_id?: number | null; status?: string | null }) {
    if (!params.business_id || Number.isNaN(params.business_id)) {
      throw new AppError('Business ID is required', 400);
    }
    return cashRegisterRepository.listRegisters(params);
  }

  public async getSummary(cash_register_id: number) {
    const {
      register,
      cashSales,
      cardSales,
      transferSales,
      movementsIn,
      movementsOut,
      refunds,
      expectedCash,
    } = await cashRegisterRepository.getSummaryData(cash_register_id);

    const closingAmount = register.closing_amount ?? null;
    const difference =
      closingAmount !== null && closingAmount !== undefined ? Number(closingAmount) - Number(expectedCash) : null;

    return {
      openingAmount: Number(register.opening_amount || 0),
      cashSales,
      cardSales,
      transferSales,
      movementsIn,
      movementsOut,
      refunds,
      expectedCash,
      closingAmount,
      difference,
    };
  }

  public async recordPaymentMovement(params: {
    business_id: number;
    order_id: number;
    amount: number;
    payment_method: PaymentMethod;
  }) {
    if (params.payment_method !== PaymentMethod.CASH) return;

    const register = await cashRegisterRepository.findActive(params.business_id);
    if (!register) return;

    await cashRegisterRepository.addMovement({
      cash_register_id: register.id,
      type: 'SALE',
      amount: params.amount,
      payment_method: PaymentMethod.CASH,
      order_id: params.order_id,
      notes: 'Auto movement from payment',
    });
  }
}

export const cashRegisterService = new CashRegisterService();





