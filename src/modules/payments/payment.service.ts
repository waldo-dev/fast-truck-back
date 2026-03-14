import { AppError } from '../../shared/errors';
import { UserRole } from '../../shared/database/models/enums';
import { paymentRepository } from './payment.repository';
import { cashRegisterService } from '../cash-registers/cash-register.service';

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
    // ADMIN y LOCAL_OPERATOR pueden registrar pagos manuales
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.LOCAL_OPERATOR) {
      throw new AppError('Only ADMIN and LOCAL_OPERATOR can create payments', 403);
    }

    const payment = await paymentRepository.create({
      ...data,
      businessId,
    });

    await cashRegisterService.recordPaymentMovement({
      business_id: businessId,
      order_id: data.order_id,
      amount: data.amount,
      payment_method: payment.payment_method,
    });

    return payment;
  }
}

export const paymentService = new PaymentService();


