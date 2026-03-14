import { z } from 'zod';

export const customerUserParamsSchema = z.object({
  userId: z.string().regex(/^\d+$/, 'User ID must be a number').transform(Number),
});

export const createCustomerSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  phone: z
    .string()
    .min(6, 'Phone is too short')
    .max(30, 'Phone must be at most 30 characters'),
  notes: z.string().max(500, 'Notes too long').optional().nullable(),
  address: z
    .object({
      address: z.string().min(1, 'Address is required'),
      notes: z.string().max(500, 'Notes too long').optional().nullable(),
      is_default: z.boolean().optional(),
    })
    .optional(),
});



