import { z } from 'zod';
import { UserRole } from '../../shared/database/models/enums';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  role: z.nativeEnum(UserRole).default(UserRole.LOCAL_OPERATOR),
  business_id: z.number().int().positive().optional(),
  business_ids: z.array(z.number().int().positive()).min(1, 'At least one business is required').optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  email: z.string().email('Invalid email format').optional(),
  role: z.nativeEnum(UserRole).optional(),
  active: z.boolean().optional(),
  business_ids: z.array(z.number().int().positive()).min(1, 'At least one business is required').optional(),
});

export const updateSelfSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
    email: z.string().email('Invalid email format').optional(),
  })
  .refine((data) => data.name || data.email, {
    message: 'At least one field (name or email) is required',
  });

export const updatePasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const userParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});

export const businessParamsSchema = z.object({
  businessId: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});

export const userBusinessParamsSchema = z.object({
  userId: z.string().regex(/^\d+$/, 'User ID must be a number').transform(Number),
});

export const adminsOwnersQuerySchema = z.object({
  business_id: z
    .string()
    .regex(/^\d+$/, 'business_id must be a number')
    .transform(Number)
    .optional(),
});

export const createDemoUserSchema = z.object({
  nombre_cliente: z
    .string()
    .min(1, 'Nombre del cliente es requerido')
    .max(100, 'Nombre del cliente debe tener menos de 100 caracteres'),
  email_cliente: z.string().email('Email del cliente inválido'),
  nombre_negocio: z
    .string()
    .min(1, 'Nombre del negocio es requerido')
    .max(100, 'Nombre del negocio debe tener menos de 100 caracteres'),
  tipo_negocio: z
    .string()
    .min(1, 'Tipo de negocio es requerido')
    .max(100, 'Tipo de negocio debe tener menos de 100 caracteres'),
  telefono: z
    .preprocess((value) => {
      if (value === '' || value === null || value === undefined) {
        return undefined;
      }
      return value;
    }, z
      .string()
      .max(20, 'Teléfono debe tener menos de 20 caracteres')
      .regex(/^[0-9+\-\s()]+$/, 'Teléfono inválido')
    )
    .optional(),
  pass: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
});


