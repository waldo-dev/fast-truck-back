import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
});

export const bulkCreateCategorySchema = z.object({
  business_ids: z.array(z.coerce.number().int().positive('Business ID must be a positive integer')).min(1, 'At least one business is required'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
});

export const categoryParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});


