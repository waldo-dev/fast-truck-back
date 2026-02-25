import { z } from 'zod';
import { ProductStatus } from '../../shared/database/models/enums';

const productStatusSchema = z.preprocess(
  (v) => (typeof v === 'string' ? (v as string).toUpperCase() : v),
  z.nativeEnum(ProductStatus)
);

const productOptionsSchema = z
  .array(
    z.object({
      id: z.coerce.number().int().positive().optional(),
      option_type: z.string().max(50, 'Option type must be less than 50 characters').optional().nullable(),
      option_value: z.string().max(100, 'Option value must be less than 100 characters').optional().nullable(),
      extra_price: z.coerce.number().int().min(0, 'Extra price must be a non-negative integer').optional(),
    })
  )
  .optional();

const businessIdsSchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        return parsed.filter((v) => v !== '' && v !== null && v !== undefined);
      }
    } catch (_) {
      return val
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v !== '');
    }
  }
  if (Array.isArray(val)) {
    return val.filter((v) => v !== '' && v !== null && v !== undefined);
  }
  return val;
}, z.array(z.coerce.number().int().positive('Business ID must be a positive integer')).min(1, 'At least one business is required'));

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150, 'Name must be less than 150 characters'),
  description: z.string().max(5000, 'Description is too long').optional().nullable(),
  price: z.coerce.number().int().positive('Price must be a positive integer'),
  category_id: z.coerce.number().int().positive('Category ID must be a positive integer').optional().nullable(),
  image_url: z.string().url('Invalid URL format').optional().nullable(),
  status: productStatusSchema.optional(),
});

const bulkBase = z.object({
  business_ids: businessIdsSchema,
});

// Soporta dos formatos: data:{...} o campos planos
export const bulkCreateProductSchema = z.union([
  bulkBase.extend({ data: createProductSchema }),
  bulkBase.merge(createProductSchema),
]);

export const updateProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150, 'Name must be less than 150 characters').optional(),
  description: z.string().max(5000, 'Description is too long').optional().nullable(),
  price: z.coerce.number().int().positive('Price must be a positive integer').optional(),
  category_id: z.coerce.number().int().positive('Category ID must be a positive integer').optional().nullable(),
  image_url: z.string().url('Invalid URL format').optional().nullable(),
  status: productStatusSchema.optional(),
  options: productOptionsSchema,
});

export const toggleProductStatusSchema = z.object({
  status: productStatusSchema,
});

export const productParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});


