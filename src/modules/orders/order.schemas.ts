import { z } from 'zod';
import { OrderSource, OrderStatus, OrderType } from '../../shared/database/models/enums';

export const createOrderSchema = z
  .object({
    customer_id: z.number().int().positive('Customer ID must be a positive integer'),
    address_id: z.number().int().positive('Address ID must be a positive integer').optional().nullable(),
    event_id: z.number().int().positive('Event ID must be a positive integer').optional().nullable(),
    order_source: z.nativeEnum(OrderSource, {
      errorMap: () => ({ message: 'Order source must be POS, WHATSAPP, or ONLINE' }),
    }),
    order_type: z.nativeEnum(OrderType, {
      errorMap: () => ({ message: 'Order type must be DELIVERY, PICKUP, or LOCAL' }),
    }),
    status: z.nativeEnum(OrderStatus).optional(),
    items: z
      .array(
        z.object({
          product_id: z.number().int().positive('Product ID must be a positive integer'),
          quantity: z.number().int().positive('Quantity must be a positive integer'),
          selected_option_ids: z.array(z.number().int().positive()).optional(),
          notes: z.string().max(500, 'Notes too long').optional().nullable(),
        })
      )
      .min(1, 'At least one item is required'),
  })
  .refine(
    (data) => {
      // Si es DELIVERY, debe tener address_id
      if (data.order_type === OrderType.DELIVERY && !data.address_id) {
        return false;
      }
      return true;
    },
    {
      message: 'Address ID is required for DELIVERY orders',
      path: ['address_id'],
    }
  );

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export const orderParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});

