import { CashRegister, CashMovement, Order } from '../../shared/database/models';
import { AppError } from '../../shared/errors';
import { PaymentMethod } from '../../shared/database/models/enums';

export class CashRegisterRepository {
  public async findActive(businessId: number, locationId?: number | null) {
    const where: any = { business_id: businessId, status: 'OPEN' };
    if (locationId !== undefined) {
      where.location_id = locationId;
    }
    return CashRegister.findOne({ where, order: [['opened_at', 'DESC']] });
  }

  public async findOpenForBusiness(businessId: number) {
    return CashRegister.findOne({
      where: { business_id: businessId, status: 'OPEN' },
      order: [['opened_at', 'DESC']],
    });
  }

  public async getNextCodeForBusiness(businessId: number): Promise<number> {
    const latestRegister = await CashRegister.findOne({
      where: { business_id: businessId },
      order: [
        ['code', 'DESC'],
        ['id', 'DESC'],
      ],
    });

    const lastCode = latestRegister?.code ?? 0;
    return Number.isFinite(lastCode) ? lastCode + 1 : 1;
  }

  public async createRegister(data: {
    business_id: number;
    location_id?: number | null;
    opened_by?: string | null;
    opening_amount?: number | null;
    code: number;
  }) {
    return CashRegister.create({
      business_id: data.business_id,
      location_id: data.location_id ?? null,
      opened_by: data.opened_by ?? null,
      opened_at: new Date(),
      opening_amount: data.opening_amount ?? 0,
      code: data.code,
      status: 'OPEN',
      closed_at: null,
      closed_by: null,
      closing_amount: null,
    });
  }

  public async closeRegister(id: number, data: { closed_by?: string | null; closing_amount?: number | null }) {
    const register = await CashRegister.findByPk(id);
    if (!register) {
      throw new AppError('Cash register not found', 404);
    }
    if (register.status === 'CLOSED') {
      throw new AppError('Cash register already closed', 400);
    }
    await register.update({
      status: 'CLOSED',
      closed_by: data.closed_by ?? null,
      closing_amount: data.closing_amount ?? null,
      closed_at: new Date(),
    });
    return register;
  }

  public async getById(id: number) {
    const register = await CashRegister.findByPk(id);
    if (!register) {
      throw new AppError('Cash register not found', 404);
    }
    return register;
  }

  public async addMovement(data: {
    cash_register_id: number;
    type?: string | null;
    amount?: number | null;
    payment_method?: string | null;
    order_id?: number | null;
    notes?: string | null;
  }) {
    const register = await CashRegister.findByPk(data.cash_register_id);
    if (!register) {
      throw new AppError('Cash register not found', 404);
    }
    if (register.status === 'CLOSED') {
      throw new AppError('Cash register is closed', 400);
    }
    return CashMovement.create({
      cash_register_id: data.cash_register_id,
      type: data.type ?? null,
      amount: data.amount ?? null,
      payment_method: data.payment_method ?? null,
      order_id: data.order_id ?? null,
      notes: data.notes ?? null,
    });
  }

  public async listMovements(cashRegisterId: number) {
    return CashMovement.findAll({
      where: { cash_register_id: cashRegisterId },
      order: [['id', 'ASC']],
    });
  }

  public async listRegisters(params: { business_id: number; location_id?: number | null; status?: string | null }) {
    const where: any = { business_id: params.business_id };
    if (params.location_id !== undefined) {
      where.location_id = params.location_id;
    }
    if (params.status) {
      where.status = params.status;
    }
    return CashRegister.findAll({
      where,
      order: [['opened_at', 'DESC']],
    });
  }

  public async getMovements(cashRegisterId: number) {
    return CashMovement.findAll({
      where: { cash_register_id: cashRegisterId },
      attributes: ['type', 'amount', 'payment_method'],
    });
  }

  public async getSummaryData(registerId: number) {
    const register = await this.getById(registerId);
    const movements = await this.getMovements(registerId);

    let cashSales = 0;
    let cardSales = 0;
    let transferSales = 0;
    let movementsIn = 0;
    let movementsOut = 0;
    let refunds = 0;

    for (const m of movements) {
      const amount = Number(m.amount || 0);
      switch (m.type) {
        case 'SALE':
          if (m.payment_method === PaymentMethod.CASH) cashSales += amount;
          else if (
            m.payment_method === PaymentMethod.CARD ||
            m.payment_method === PaymentMethod.DEBIT_CARD ||
            m.payment_method === PaymentMethod.CREDIT_CARD
          ) {
            cardSales += amount;
          } else if (m.payment_method === PaymentMethod.TRANSFER || m.payment_method === PaymentMethod.WEBPAY) {
            transferSales += amount;
          } else {
            cashSales += amount;
          }
          break;
        case 'IN':
          movementsIn += amount;
          break;
        case 'OUT':
          movementsOut += amount;
          break;
        case 'REFUND':
          refunds += amount;
          break;
        default:
          break;
      }
    }

    const expectedCash = Number(register.opening_amount || 0) + cashSales + movementsIn - movementsOut - refunds;

    return {
      register,
      cashSales,
      cardSales,
      transferSales,
      movementsIn,
      movementsOut,
      refunds,
      expectedCash,
    };
  }

  public async findPaymentOrder(orderId: number) {
    return Order.findByPk(orderId);
  }
}

export const cashRegisterRepository = new CashRegisterRepository();





