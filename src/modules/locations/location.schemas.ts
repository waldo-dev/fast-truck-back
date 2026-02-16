import { z } from 'zod';

export const createLocationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  address: z.string().max(500, 'Address is too long').optional().nullable(),
  is_main: z.boolean().optional(),
});

export const locationParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});


