import { AppError } from '../../shared/errors';
import { UserRole } from '../../shared/database/models/enums';
import { paymentRepository } from './payment.repository';

export class PaymentService {
  public async getPaymentsByOrder(orderId: number, businessId: number) {
    const payments = await paymentRepository.findAllByOrder(orderId, businessId);
    return payments;
  }

  public async createPayment(
    data: {
      order_id: number;
      payment_method: string;
      amount: number;
    },
    businessId: number,
    userRole: UserRole
  ) {
    // ADMIN y STAFF pueden registrar pagos manuales
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.STAFF) {
      throw new AppError('Only ADMIN and STAFF can create payments', 403);
    }

    const payment = await paymentRepository.create({
      ...data,
      businessId,
    });

    return payment;
  }
}

export const paymentService = new PaymentService();

