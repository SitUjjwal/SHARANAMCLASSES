/**
 * Shared param / query primitives used across domain validators.
 */
import { z } from 'zod';

export const uuidSchema = z.string().uuid('Must be a valid UUID');

export const uuidIdParamSchema = z.object({
  id: uuidSchema,
});

export const uuidNamedParam = (name: string) =>
  z.object({
    [name]: uuidSchema,
  });

export const paymentIdParamSchema = z.object({
  paymentId: z.string().trim().min(3).max(128),
});

export const orderIdParamSchema = z.object({
  orderId: z.string().trim().min(3).max(128),
});

export const feedbackIdParamSchema = z.object({
  feedbackId: uuidSchema,
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
