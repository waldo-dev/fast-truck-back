import { z } from 'zod';

export const createProductOptionSchema = z.object({
  option_type: z.string().max(50, 'Option type must be less than 50 characters').optional().nullable(),
  option_value: z.string().max(100, 'Option value must be less than 100 characters').optional().nullable(),
  extra_price: z.number().int().min(0, 'Extra price must be a non-negative integer').optional(),
});

export const updateProductOptionSchema = z.object({
  option_type: z.string().max(50, 'Option type must be less than 50 characters').optional().nullable(),
  option_value: z.string().max(100, 'Option value must be less than 100 characters').optional().nullable(),
  extra_price: z.number().int().min(0, 'Extra price must be a non-negative integer').optional(),
});

export const productOptionParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});

export const productParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});


