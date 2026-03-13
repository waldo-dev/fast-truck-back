import { z } from 'zod';

export const openRegisterSchema = z.object({
  business_id: z.coerce.number().int().positive('Business ID must be positive'),
  location_id: z.coerce.number().int().positive().nullable().optional(),
  opened_by: z.string().trim().optional().nullable(),
  opening_amount: z.coerce.number().nonnegative().optional(),
  allowMultiple: z.boolean().optional(),
});

export const closeRegisterSchema = z.object({
  closed_by: z.string().trim().optional().nullable(),
  closing_amount: z.coerce.number().nonnegative().optional(),
});

export const movementSchema = z.object({
  cash_register_id: z.coerce.number().int().positive('Cash register ID must be positive'),
  type: z.string().trim().optional(),
  amount: z.coerce.number().optional(),
  payment_method: z.string().trim().optional(),
  order_id: z.coerce.number().int().positive().optional(),
  opcional: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});


