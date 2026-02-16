import { z } from 'zod';

export const createEventSchema = z.object({
  location_id: z.number().int().positive('Location ID must be a positive integer').optional().nullable(),
  name: z.string().min(1, 'Name is required').max(150, 'Name must be less than 150 characters').optional().nullable(),
  description: z.string().max(5000, 'Description is too long').optional().nullable(),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Event date must be in YYYY-MM-DD format').optional().nullable(),
  organizer: z.string().max(150, 'Organizer must be less than 150 characters').optional().nullable(),
  notes: z.string().max(5000, 'Notes too long').optional().nullable(),
});

export const eventParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});


