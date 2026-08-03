/**
 * System settings validators.
 */
import { z } from 'zod';

const hexColor = z
  .string()
  .trim()
  .regex(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/, 'Must be a hex color (#RGB or #RRGGBB)');

/** Empty or http(s)/tel/mailto link — soft so admins can paste wa.me etc. */
const socialLink = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) =>
      v === '' ||
      /^https?:\/\//i.test(v) ||
      /^tel:/i.test(v) ||
      /^mailto:/i.test(v),
    { message: 'Must be empty or a valid http(s)/tel/mailto URL' },
  );

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
    social_facebook: socialLink.optional().default(''),
    social_instagram: socialLink.optional().default(''),
    social_telegram: socialLink.optional().default(''),
    social_youtube: socialLink.optional().default(''),
    social_whatsapp: socialLink.optional().default(''),
  }),
});

/** Partial settings patch (any subset of general fields). */
export const patchSystemSettingsSchema = z.object({
  general: z
    .object({
      app_name: z.string().trim().min(1).max(120).optional(),
      logo_url: z.string().max(2000).optional(),
      logo_storage_key: z.string().max(500).optional(),
      primary_color: hexColor.optional(),
      support_email: z.union([z.string().trim().email().max(200), z.literal('')]).optional(),
      support_phone: z.string().trim().max(40).optional(),
      privacy_policy: z.string().max(100_000).optional(),
      terms: z.string().max(100_000).optional(),
      maintenance_mode: z.boolean().optional(),
      app_version: z.string().trim().min(1).max(40).optional(),
      min_app_version: z.string().trim().min(1).max(40).optional(),
      timezone: z.string().trim().min(1).max(80).optional(),
      social_facebook: socialLink.optional(),
      social_instagram: socialLink.optional(),
      social_telegram: socialLink.optional(),
      social_youtube: socialLink.optional(),
      social_whatsapp: socialLink.optional(),
    })
    .refine((g) => Object.keys(g).length > 0, {
      message: 'Provide at least one settings field',
    }),
});

export type UpdateSystemSettingsInput = z.infer<typeof updateSystemSettingsSchema>;
export type PatchSystemSettingsInput = z.infer<typeof patchSystemSettingsSchema>;
