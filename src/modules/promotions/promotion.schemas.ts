import { z } from 'zod';
import { DiscountType } from '../../shared/database/models/enums';

export const createPromotionSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
    description: z.string().max(5000, 'Description is too long').optional().nullable(),
    discount_type: z.nativeEnum(DiscountType, {
      errorMap: () => ({ message: 'Discount type must be FIXED or PERCENTAGE' }),
    }),
    discount_value: z.number().int().positive('Discount value must be a positive integer'),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional().nullable(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional().nullable(),
    active: z.boolean().optional(),
    product_ids: z.array(z.number().int().positive('Product ID must be a positive integer')).min(1, 'At least one product is required').optional(),
  })
  .refine(
    (data) => {
      if (data.discount_type === DiscountType.PERCENTAGE) {
        return data.discount_value <= 100;
      }
      return true;
    },
    {
      message: 'Percentage discount cannot exceed 100%',
      path: ['discount_value'],
    }
  )
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        return new Date(data.start_date) <= new Date(data.end_date);
      }
      return true;
    },
    {
      message: 'End date must be after or equal to start date',
      path: ['end_date'],
    }
  );

export const updatePromotionSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
    description: z.string().max(5000, 'Description is too long').optional().nullable(),
    discount_type: z.nativeEnum(DiscountType).optional(),
    discount_value: z.number().int().positive('Discount value must be a positive integer').optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional().nullable(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional().nullable(),
    active: z.boolean().optional(),
    product_ids: z.array(z.number().int().positive('Product ID must be a positive integer')).optional(),
  })
  .refine(
    (data) => {
      if (data.discount_type === DiscountType.PERCENTAGE && data.discount_value !== undefined) {
        return data.discount_value <= 100;
      }
      return true;
    },
    {
      message: 'Percentage discount cannot exceed 100%',
      path: ['discount_value'],
    }
  )
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        return new Date(data.start_date) <= new Date(data.end_date);
      }
      return true;
    },
    {
      message: 'End date must be after or equal to start date',
      path: ['end_date'],
    }
  );

export const togglePromotionStatusSchema = z.object({
  active: z.boolean(),
});

export const promotionParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});

export const addProductsToPromotionSchema = z.object({
  product_ids: z.array(z.number().int().positive('Product ID must be a positive integer')).min(1, 'At least one product is required'),
});

export const removeProductsFromPromotionSchema = z.object({
  product_ids: z.array(z.number().int().positive('Product ID must be a positive integer')).min(1, 'At least one product is required'),
});


