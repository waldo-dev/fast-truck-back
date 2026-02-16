import { z } from 'zod';
import { PaymentProvider, PaymentEnvironment } from '../../shared/database/models/enums';

export const createPaymentConfigSchema = z.object({
  provider: z.nativeEnum(PaymentProvider, {
    errorMap: () => ({ message: 'Provider must be WEBPAY, STRIPE, MERCADOPAGO, or OTHER' }),
  }),
  commerce_code: z.string().min(1, 'Commerce code is required').max(50, 'Commerce code must be less than 50 characters'),
  api_key: z.string().min(1, 'API key is required'),
  environment: z.nativeEnum(PaymentEnvironment).default(PaymentEnvironment.TEST),
  active: z.boolean().optional(),
});

export const paymentConfigParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});

