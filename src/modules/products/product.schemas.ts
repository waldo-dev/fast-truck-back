import { z } from 'zod';
import { ProductStatus } from '../../shared/database/models/enums';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150, 'Name must be less than 150 characters'),
  description: z.string().max(5000, 'Description is too long').optional().nullable(),
  price: z.number().int().positive('Price must be a positive integer'),
  category_id: z.number().int().positive('Category ID must be a positive integer').optional().nullable(),
  image_url: z.string().url('Invalid URL format').optional().nullable(),
  status: z.nativeEnum(ProductStatus).optional(),
  options: z
    .array(
      z.object({
        option_type: z.string().max(50, 'Option type must be less than 50 characters').optional().nullable(),
        option_value: z.string().max(100, 'Option value must be less than 100 characters').optional().nullable(),
        extra_price: z.number().int().min(0, 'Extra price must be a non-negative integer').optional(),
      })
    )
    .optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150, 'Name must be less than 150 characters').optional(),
  description: z.string().max(5000, 'Description is too long').optional().nullable(),
  price: z.number().int().positive('Price must be a positive integer').optional(),
  category_id: z.number().int().positive('Category ID must be a positive integer').optional().nullable(),
  image_url: z.string().url('Invalid URL format').optional().nullable(),
  status: z.nativeEnum(ProductStatus).optional(),
  options: z
    .array(
      z.object({
        id: z.number().int().positive().optional(),
        option_type: z.string().max(50, 'Option type must be less than 50 characters').optional().nullable(),
        option_value: z.string().max(100, 'Option value must be less than 100 characters').optional().nullable(),
        extra_price: z.number().int().min(0, 'Extra price must be a non-negative integer').optional(),
      })
    )
    .optional(),
});

export const toggleProductStatusSchema = z.object({
  status: z.nativeEnum(ProductStatus),
});

export const productParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});


