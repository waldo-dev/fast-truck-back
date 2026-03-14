import { z } from 'zod';

const positiveInt = z.number().int().positive('Must be a positive integer');
const nonNegativeNumber = z.number().nonnegative('Must be zero or positive');

export const createPlanSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be at most 50 characters'),
  description: z.string().max(5000, 'Description too long').optional().nullable(),
  price_monthly: nonNegativeNumber.optional().nullable(),
  price_yearly: nonNegativeNumber.optional().nullable(),
  max_events: positiveInt.optional().nullable(),
  max_products: positiveInt.optional().nullable(),
  max_users: positiveInt.optional().nullable(),
  max_locations: positiveInt.optional().nullable(),
  features: z.record(z.any()).optional().nullable(),
  active: z.boolean().optional(),
});

export const updatePlanSchema = createPlanSchema.partial();

export const planParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});









