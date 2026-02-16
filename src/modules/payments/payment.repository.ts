import { Payment, Order } from '../../shared/database/models';
import { AppError } from '../../shared/errors';
import { PaymentStatus } from '../../shared/database/models/enums';

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
  }) {
    // Verificar que el order pertenezca al business
    const order = await Order.findOne({
      where: {
        id: data.order_id,
        business_id: data.businessId,
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const payment = await Payment.create({
      order_id: data.order_id,
      payment_method: data.payment_method as any,
      payment_status: PaymentStatus.PENDING,
      amount: data.amount,
    });

    return payment.reload();
  }
}

export const paymentRepository = new PaymentRepository();


