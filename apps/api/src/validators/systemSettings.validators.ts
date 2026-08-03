/**
 * System settings validators.
 */
import { z } from 'zod';

const hexColor = z
  .string()
  .trim()
  .regex(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/, 'Must be a hex color (#RGB or #RRGGBB)');

export const updateSystemSettingsSchema = z.object({
  general: z.object({
    app_name: z.string().trim().min(1).max(120),
    logo_url: z.string().max(2000).optional().default(''),
    logo_storage_key: z.string().max(500).optional().default(''),
    primary_color: hexColor,
    support_email: z.union([z.string().trim().email().max(200), z.literal('')]),
    support_phone: z.string().trim().max(40),
    privacy_policy: z.string().max(100_000),
    terms: z.string().max(100_000),
    maintenance_mode: z.boolean(),
    app_version: z.string().trim().min(1).max(40),
    min_app_version: z.string().trim().min(1).max(40),
    timezone: z.string().trim().min(1).max(80),
  }),
});

export type UpdateSystemSettingsInput = z.infer<typeof updateSystemSettingsSchema>;
