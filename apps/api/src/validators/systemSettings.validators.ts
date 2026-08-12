/**
 * System settings validators.
 */
import { z } from 'zod';

const hexColor = z
  .string()
  .trim()
  .regex(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/, 'Must be a hex color (#RGB or #RRGGBB)');

const semver = z
  .string()
  .trim()
  .regex(/^\d+\.\d+\.\d+$/, 'Must be SemVer MAJOR.MINOR.PATCH (e.g. 1.2.0)');

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

const storeUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || /^https?:\/\//i.test(v), {
    message: 'Must be empty or an http(s) URL',
  });

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
    app_version: semver,
    min_app_version: semver,
    recommended_app_version: z.union([semver, z.literal('')]).optional().default(''),
    force_update: z.boolean(),
    optional_update: z.boolean(),
    release_notes: z.string().max(20_000),
    android_build_number: z.number().int().min(1).max(2_000_000_000),
    ios_build_number: z.string().trim().min(1).max(40),
    store_url_android: storeUrl,
    store_url_ios: storeUrl,
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
      app_version: semver.optional(),
      min_app_version: semver.optional(),
      recommended_app_version: z.union([semver, z.literal('')]).optional(),
      force_update: z.boolean().optional(),
      optional_update: z.boolean().optional(),
      release_notes: z.string().max(20_000).optional(),
      android_build_number: z.number().int().min(1).max(2_000_000_000).optional(),
      ios_build_number: z.string().trim().min(1).max(40).optional(),
      store_url_android: storeUrl.optional(),
      store_url_ios: storeUrl.optional(),
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
