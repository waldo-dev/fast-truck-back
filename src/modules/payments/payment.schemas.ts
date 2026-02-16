import { z } from 'zod';
import { PaymentMethod } from '../../shared/database/models/enums';

export const createPaymentSchema = z.object({
  order_id: z.number().int().positive('Order ID must be a positive integer'),
  payment_method: z.nativeEnum(PaymentMethod, {
    errorMap: () => ({ message: 'Payment method must be CASH, CARD, TRANSFER, or WEBPAY' }),
  }),
  amount: z.number().int().positive('Amount must be a positive integer'),
});

export const paymentParamsSchema = z.object({
  orderId: z.string().regex(/^\d+$/, 'Order ID must be a number').transform(Number),
});

