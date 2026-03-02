import { z } from 'zod';

export const customerUserParamsSchema = z.object({
  userId: z.string().regex(/^\d+$/, 'User ID must be a number').transform(Number),
});

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(6, 'Phone is too short'),
  notes: z.string().max(500, 'Notes too long').optional().nullable(),
  address: z
    .object({
      address: z.string().min(1, 'Address is required'),
      notes: z.string().max(500, 'Notes too long').optional().nullable(),
      is_default: z.boolean().optional(),
    })
    .optional(),
});
