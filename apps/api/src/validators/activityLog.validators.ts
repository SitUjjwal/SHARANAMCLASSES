/**
 * Activity log validators.
 */
import { z } from 'zod';

export const clientActivityEventSchema = z
  .object({
    action: z.enum(['auth.login', 'auth.logout']),
    metadata: z.record(z.unknown()).optional(),
  })
  .strict();

export type ClientActivityEventInput = z.infer<typeof clientActivityEventSchema>;
