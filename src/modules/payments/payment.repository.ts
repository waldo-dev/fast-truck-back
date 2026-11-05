import {
  Payment,
  Order,
  CashRegister,
  CashMovement,
} from '../../shared/database/models';
import { sequelize } from '../../shared/database/connection';
import { AppError } from '../../shared/errors';
import { PaymentStatus, OrderStatus } from '../../shared/database/models/enums';

export class PaymentRepository {
  public async findAllByOrder(orderId: number, businessId: number) {
    // Verificar que el order pertenezca al business
    const order = await Order.findOne({
      where: {
        id: orderId,
        business_id: businessId,
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const payments = await Payment.findAll({
      where: {
        order_id: orderId,
      },
      order: [['id', 'DESC']],
    });

    return payments;
  }

  public async create(data: {
    order_id: number;
    payment_method: string;
    amount: number;
    businessId: number;
    cash_register_id?: number;
  }) {
    return sequelize.transaction(async transaction => {
      const order = await Order.findOne({
        where: {
          id: data.order_id,
          business_id: data.businessId,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (order.status === OrderStatus.CANCELLED)
        throw new AppError('No se puede cobrar un pedido anulado.', 409);
      const paid = await Payment.findOne({
        where: { order_id: order.id, payment_status: PaymentStatus.PAID },
        transaction,
      });
      if (paid) {
        if (
          Number(paid.amount) === data.amount &&
          paid.payment_method === data.payment_method
        )
          return paid;
        throw new AppError('El pedido ya está cobrado.', 409);
      }
      if (data.amount !== Number(order.total))
        throw new AppError(
          'El pago debe coincidir con el total del pedido.',
          400
        );
      const register = await CashRegister.findOne({
        where: {
          business_id: data.businessId,
          status: 'OPEN',
          ...(data.cash_register_id ? { id: data.cash_register_id } : {}),
        },
        order: [['id', 'DESC']],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!register)
        throw new AppError(
          'Abre una caja antes de registrar el pago recibido.',
          409
        );
      await Payment.update(
        { payment_status: PaymentStatus.FAILED },
        {
          where: { order_id: order.id, payment_status: PaymentStatus.PENDING },
          transaction,
        }
      );
      const payment = await Payment.create(
        {
          order_id: data.order_id,
          payment_method: data.payment_method as any,
          payment_status: PaymentStatus.PAID,
          amount: data.amount,
        },
        { transaction }
      );
      await CashMovement.create(
        {
          cash_register_id: register.id,
          order_id: order.id,
          type: 'SALE',
          amount: data.amount,
          payment_method: data.payment_method,
          notes: 'Pago recibido',
        },
        { transaction }
      );

      return payment;
    });
  }
}

export const paymentRepository = new PaymentRepository();
