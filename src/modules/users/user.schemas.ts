import { z } from 'zod';
import { UserRole } from '../../shared/database/models/enums';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  role: z.nativeEnum(UserRole).default(UserRole.STAFF),
  business_id: z.number().int().positive().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  email: z.string().email('Invalid email format').optional(),
  role: z.nativeEnum(UserRole).optional(),
  active: z.boolean().optional(),
});

export const userParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});


