import { CashRegister, CashMovement } from '../../shared/database/models';
import { AppError } from '../../shared/errors';

export class CashRegisterRepository {
  public async findActive(businessId: number, locationId?: number | null) {
    const where: any = { business_id: businessId, status: 'OPEN' };
    if (locationId) {
      where.location_id = locationId;
    }
    return CashRegister.findOne({ where });
  }

  public async createRegister(data: {
    business_id: number;
    location_id?: number | null;
    opened_by?: string | null;
    opening_amount?: number | null;
  }) {
    return CashRegister.create({
      business_id: data.business_id,
      location_id: data.location_id ?? null,
      opened_by: data.opened_by ?? null,
      opened_at: new Date(),
      opening_amount: data.opening_amount ?? 0,
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
    opcional?: string | null;
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
      opcional: data.opcional ?? null,
      notes: data.notes ?? null,
    });
  }

  public async listMovements(cashRegisterId: number) {
    return CashMovement.findAll({
      where: { cash_register_id: cashRegisterId },
      order: [['id', 'ASC']],
    });
  }
}

export const cashRegisterRepository = new CashRegisterRepository();



