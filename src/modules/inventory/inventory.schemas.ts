import { z } from 'zod';
import { InventoryMovementType, InventoryUnit } from '../../shared/database/models/enums';

export const listItemsQuerySchema = z.object({
  search: z.string().optional(),
  active: z
    .string()
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;
      return v === 'true';
    }),
});

export const createItemSchema = z.object({
  name: z.string().min(1).max(100, 'Name must be at most 100 characters'),
  unit: z.nativeEnum(InventoryUnit),
  cost_per_item: z.coerce.number().nonnegative().optional(),
  min_stock: z.coerce.number().nonnegative().optional(),
  active: z.boolean().optional(),
});

export const updateItemSchema = z.object({
  name: z.string().min(1).max(100, 'Name must be at most 100 characters').optional(),
  unit: z.nativeEnum(InventoryUnit).optional(),
  cost_per_item: z.coerce.number().nonnegative().optional(),
  min_stock: z.coerce.number().nonnegative().optional(),
  active: z.boolean().optional(),
});

export const paramsIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});

export const paramsMovementSchema = z.object({
  itemId: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});

export const createMovementSchema = z.object({
  inventory_item_id: z.coerce.number().int().positive(),
  quantity: z.coerce.number().positive(),
  movement_type: z.nativeEnum(InventoryMovementType),
  reason: z.string().max(150).optional().nullable(),
  event_id: z.coerce.number().int().positive().optional().nullable(),
  location_id: z.coerce.number().int().positive().optional().nullable(),
});

export const setRecipesSchema = z.object({
  recipes: z
    .array(
      z.object({
        inventory_item_id: z.coerce.number().int().positive(),
        quantity_required: z.coerce.number().positive(),
      })
    )
    .min(1, 'At least one recipe row is required'),
});

export const paramsProductSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});

export const paramsOptionSchema = z.object({
  optionId: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});


