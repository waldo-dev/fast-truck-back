import { z } from 'zod';
import { SubscriptionStatus, PaymentStatus } from '../../shared/database/models/enums';

const dateTime = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/, 'Must be ISO datetime in UTC (e.g. 2026-02-02T00:00:00.000Z)');

export const createSubscriptionSchema = z.object({
  business_id: z
    .coerce
    .number()
    .int()
    .positive('business_id is required')
    .optional(),
  plan_id: z.number().int().positive('plan_id is required'),
  status: z.nativeEnum(SubscriptionStatus).optional(),
  trial_ends_at: dateTime.optional().nullable(),
  current_period_start: dateTime.optional().nullable(),
  current_period_end: dateTime.optional().nullable(),
  billing_period: z.enum(['monthly', 'yearly']).optional(),
  cancel_at_period_end: z.boolean().optional(),
  payment_provider: z.string().max(50).optional().nullable(),
  provider_subscription_id: z.string().max(150).optional().nullable(),
});

export const updateSubscriptionSchema = z.object({
  status: z.nativeEnum(SubscriptionStatus).optional(),
  trial_ends_at: dateTime.optional().nullable(),
  current_period_start: dateTime.optional().nullable(),
  current_period_end: dateTime.optional().nullable(),
  billing_period: z.enum(['monthly', 'yearly']).optional(),
  cancel_at_period_end: z.boolean().optional(),
  payment_provider: z.string().max(50).optional().nullable(),
  provider_subscription_id: z.string().max(150).optional().nullable(),
});

export const subscriptionParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});

export const createSubscriptionPaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().max(10).default('CLP'),
  status: z.nativeEnum(PaymentStatus).optional(),
  provider: z.string().max(50).optional().nullable(),
  provider_payment_id: z.string().max(150).optional().nullable(),
  paid_at: dateTime.optional().nullable(),
});

export const subscriptionQuerySchema = z.object({
  status: z.nativeEnum(SubscriptionStatus).optional(),
  plan_id: z
    .string()
    .regex(/^\d+$/, 'plan_id must be a number')
    .transform(Number)
    .optional(),
  business_id: z
    .string()
    .regex(/^\d+$/, 'business_id must be a number')
    .transform(Number)
    .optional(),
});


