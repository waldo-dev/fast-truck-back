import { z } from 'zod';

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be in YYYY-MM-DD format');
const dateTime = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/, 'Must be ISO datetime in UTC (e.g. 2026-02-02T00:00:00.000Z)');

export const createEventSchema = z.object({
  business_id: z
    .coerce
    .number()
    .int()
    .positive('Business ID must be a positive integer')
    .optional(),
  location_id: z.number().int().positive('Location ID must be a positive integer').optional().nullable(),
  name: z.string().min(1, 'Name is required').max(150, 'Name must be less than 150 characters').optional().nullable(),
  description: z.string().max(5000, 'Description is too long').optional().nullable(),
  event_date: dateOnly.optional().nullable(),
  organizer: z.string().max(150, 'Organizer must be less than 150 characters').optional().nullable(),
  notes: z.string().max(5000, 'Notes too long').optional().nullable(),
  event_type: z.string().max(150).optional().nullable(),
  expected_attendance: z.number().int().nonnegative().optional().nullable(),
  weather_condition: z.string().max(150).optional().nullable(),
  start_at: dateTime.optional().nullable(),
  end_at: dateTime.optional().nullable(),
  city: z.string().max(150).optional().nullable(),
  district: z.string().max(150).optional().nullable(),
  status: z.string().max(150).optional().nullable(),
  closed_at: dateTime.optional().nullable(),
  is_active: z.boolean().optional(),
  address: z.string().min(1, 'Address is required').optional(), // si no se pasa location_id, se usará para crear un location
  location_name: z.string().max(150).optional(), // opcional, nombre para la ubicación creada
  product_ids: z.array(z.number().int().positive()).optional(),
  organizers: z
    .array(
      z.object({
        name: z.string().min(1, 'Organizer name is required'),
        role: z.string().max(100).optional().nullable(),
        email: z.string().email().optional().nullable(),
        phone: z.string().max(50).optional().nullable(),
        notes: z.string().max(5000).optional().nullable(),
      })
    )
    .optional(),
});

export const eventParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});

export const createExpenseSchema = z.object({
  type: z.string().max(50).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  amount: z.number().positive('Amount must be greater than 0'),
});

export const expenseParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
  expenseId: z.string().regex(/^\d+$/, 'Expense ID must be a number').transform(Number),
});


