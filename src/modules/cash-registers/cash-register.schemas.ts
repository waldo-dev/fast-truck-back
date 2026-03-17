import { z } from 'zod';
import { PaymentMethod } from '../../shared/database/models/enums';

const positiveId = z.coerce.number().int().positive();
const statusEnum = z.enum(['OPEN', 'CLOSED']);

export const openRegisterSchema = z
  .object({
    businessId: positiveId.optional(),
    business_id: positiveId.optional(),
    locationId: positiveId.optional().nullable(),
    location_id: positiveId.optional().nullable(),
    userId: positiveId.optional(),
    opened_by: z.string().trim().optional().nullable(),
    openingAmount: z.coerce.number().nonnegative('openingAmount must be zero or positive').optional(),
    opening_amount: z.coerce.number().nonnegative().optional(),
    allowMultiple: z.boolean().optional(),
    code: z.string().optional(),
  })
  .refine((data) => data.businessId || data.business_id, {
    message: 'businessId is required',
    path: ['businessId'],
  });

export const closeRegisterSchema = z.object({
  userId: positiveId.optional(),
  closed_by: z.string().trim().optional().nullable(),
  closingAmount: z.coerce.number().nonnegative('closingAmount must be zero or positive').optional(),
  closing_amount: z.coerce.number().nonnegative().optional(),
});

export const movementSchema = z.object({
  type: z.enum(['IN', 'OUT', 'SALE', 'REFUND']),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  payment_method: z.nativeEnum(PaymentMethod).optional(),
  order_id: positiveId.optional(),
  notes: z.string().trim().optional().nullable(),
});

export const historyQuerySchema = z
  .object({
    business_id: positiveId.optional(),
    businessId: positiveId.optional(),
    location_id: positiveId.optional().nullable(),
    locationId: positiveId.optional().nullable(),
    status: statusEnum.optional(),
    code: z.string().optional(),
  })
  .refine((data) => data.business_id || data.businessId, {
    message: 'business_id is required',
    path: ['business_id'],
  });
