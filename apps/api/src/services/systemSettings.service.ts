/**
 * System Settings — branding, support, legal, maintenance, app version.
 * Stored in platform_settings key=general (JSONB). RLS deny-all; API service role only.
 */
import type {
  PlatformGeneralSettings,
  PlatformLogoUploadResult,
  PlatformSettingsBundle,
  PublicPlatformConfig,
} from '@sharanam/shared';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

import { env, isR2Configured } from '../config/env';
import { getSupabaseAdmin } from '../config/supabase';
import { putR2Object } from '../integrations/r2/client';
import { AppError } from '../utils/AppError';
import { writeActivityLog } from './activityLog.service';

const SETTINGS_KEY = 'general';
const TZ = 'Asia/Kolkata';
const FALLBACK_BUCKET = 'course-thumbnails';
const LOGO_ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']);
const LOGO_MAX_BYTES = 2 * 1024 * 1024;

const HEX_COLOR = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;

export const DEFAULT_GENERAL: PlatformGeneralSettings = {
  app_name: 'SHARANAM CLASSES',
  logo_url: '',
  logo_storage_key: '',
  primary_color: '#0B6E4F',
  support_email: 'support@sharanamclasses.com',
  support_phone: '',
  privacy_policy: '',
  terms: '',
  maintenance_mode: false,
  app_version: '1.0.0',
  min_app_version: '1.0.0',
  timezone: TZ,
};

/** Short-lived in-memory cache for public/maintenance reads. */
let cache: { at: number; bundle: PlatformSettingsBundle } | null = null;
const CACHE_TTL_MS = 15_000;

export function invalidateSettingsCache(): void {
  cache = null;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function normalizeHexColor(value: unknown, fallback: string): string {
  const raw = asString(value, fallback);
  if (!HEX_COLOR.test(raw)) return fallback;
  return raw.length === 4
    ? `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`.toUpperCase()
    : raw.toUpperCase();
}

export function parseGeneral(value: unknown): PlatformGeneralSettings {
  const v = (value && typeof value === 'object' ? value : {}) as Record<
    string,
    unknown
  >;
  return {
    app_name: asString(v.app_name, DEFAULT_GENERAL.app_name) || DEFAULT_GENERAL.app_name,
    logo_url: asString(v.logo_url, DEFAULT_GENERAL.logo_url),
    logo_storage_key: asString(v.logo_storage_key, DEFAULT_GENERAL.logo_storage_key),
    primary_color: normalizeHexColor(v.primary_color, DEFAULT_GENERAL.primary_color),
    support_email: asString(v.support_email, DEFAULT_GENERAL.support_email),
    support_phone: asString(v.support_phone, DEFAULT_GENERAL.support_phone),
    privacy_policy:
      typeof v.privacy_policy === 'string' ? v.privacy_policy : DEFAULT_GENERAL.privacy_policy,
    terms: typeof v.terms === 'string' ? v.terms : DEFAULT_GENERAL.terms,
    maintenance_mode: Boolean(v.maintenance_mode),
    app_version: asString(v.app_version, DEFAULT_GENERAL.app_version) || DEFAULT_GENERAL.app_version,
    min_app_version:
      asString(v.min_app_version, DEFAULT_GENERAL.min_app_version) ||
      DEFAULT_GENERAL.min_app_version,
    timezone: asString(v.timezone, DEFAULT_GENERAL.timezone) || DEFAULT_GENERAL.timezone,
  };
}

export function toPublicConfig(bundle: PlatformSettingsBundle): PublicPlatformConfig {
  const g = bundle.general;
  return {
    app_name: g.app_name,
    logo_url: g.logo_url,
    primary_color: g.primary_color,
    support_email: g.support_email,
    support_phone: g.support_phone,
    privacy_policy: g.privacy_policy,
    terms: g.terms,
    maintenance_mode: g.maintenance_mode,
    app_version: g.app_version,
    min_app_version: g.min_app_version,
    timezone: g.timezone,
    updated_at: bundle.updated_at,
  };
}

async function readBundleFresh(): Promise<PlatformSettingsBundle> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('platform_settings')
    .select('value, updated_at')
    .eq('key', SETTINGS_KEY)
    .maybeSingle();

  if (error) {
    if (error.message.toLowerCase().includes('does not exist')) {
      return { general: DEFAULT_GENERAL, updated_at: null };
    }
    throw new AppError(500, 'SETTINGS_READ_FAILED', error.message);
  }

  return {
    general: parseGeneral(data?.value),
    updated_at: (data?.updated_at as string | undefined) ?? null,
  };
}

export async function getPlatformSettings(
  opts: { bypassCache?: boolean } = {},
): Promise<PlatformSettingsBundle> {
  if (!opts.bypassCache && cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.bundle;
  }
  const bundle = await readBundleFresh();
  cache = { at: Date.now(), bundle };
  return bundle;
}

export async function getPublicPlatformConfig(): Promise<PublicPlatformConfig> {
  return toPublicConfig(await getPlatformSettings());
}

export async function isMaintenanceModeEnabled(): Promise<boolean> {
  const bundle = await getPlatformSettings();
  return bundle.general.maintenance_mode;
}

export async function updatePlatformSettings(input: {
  general: PlatformGeneralSettings;
  actor_id: string;
  actor_email: string | null;
}): Promise<PlatformSettingsBundle> {
  const general = parseGeneral(input.general);
  if (!HEX_COLOR.test(general.primary_color)) {
    throw new AppError(400, 'INVALID_PRIMARY_COLOR', 'primary_color must be a hex color (#RGB or #RRGGBB)');
  }
  if (!general.app_name.trim()) {
    throw new AppError(400, 'INVALID_APP_NAME', 'app_name is required');
  }

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('platform_settings')
    .upsert(
      {
        key: SETTINGS_KEY,
        value: general,
        updated_at: now,
        updated_by: input.actor_id,
      },
      { onConflict: 'key' },
    )
    .select('value, updated_at')
    .single();

  if (error) {
    throw new AppError(500, 'SETTINGS_WRITE_FAILED', error.message);
  }

  invalidateSettingsCache();

  await writeActivityLog({
    actor_id: input.actor_id,
    actor_email: input.actor_email,
    action: 'settings.update',
    entity_type: 'platform_settings',
    entity_id: SETTINGS_KEY,
    summary: `Updated system settings (${general.app_name})`,
    metadata: {
      app_name: general.app_name,
      maintenance_mode: general.maintenance_mode,
      app_version: general.app_version,
      primary_color: general.primary_color,
    },
  });

  const bundle: PlatformSettingsBundle = {
    general: parseGeneral(data?.value ?? general),
    updated_at: (data?.updated_at as string | undefined) ?? now,
  };
  cache = { at: Date.now(), bundle };
  return bundle;
}

function extensionFor(mimetype: string, originalname: string): string {
  const fromName = path.extname(originalname).replace('.', '').toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(fromName)) {
    return fromName === 'jpeg' ? 'jpg' : fromName;
  }
  if (mimetype === 'image/png') return 'png';
  if (mimetype === 'image/webp') return 'webp';
  if (mimetype === 'image/svg+xml') return 'svg';
  return 'jpg';
}

/**
 * Upload platform logo → R2 (Supabase fallback in non-production).
 * Persists logo_url + logo_storage_key into settings.
 */
export async function uploadPlatformLogo(input: {
  actor_id: string;
  actor_email: string | null;
  file: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
    size: number;
  };
}): Promise<PlatformSettingsBundle> {
  const { file } = input;
  if (!LOGO_ALLOWED.has(file.mimetype)) {
    throw new AppError(400, 'INVALID_IMAGE_TYPE', 'Use JPEG, PNG, WebP, or SVG for the logo');
  }
  if (file.size <= 0) {
    throw new AppError(400, 'EMPTY_IMAGE', 'Logo file is empty');
  }
  if (file.size > LOGO_MAX_BYTES) {
    throw new AppError(400, 'IMAGE_TOO_LARGE', 'Logo must be 2MB or smaller');
  }

  const ext = extensionFor(file.mimetype, file.originalname);
  const objectKey = `branding/logo/${Date.now()}-${randomUUID()}.${ext}`;

  let uploaded: PlatformLogoUploadResult;

  if (isR2Configured()) {
    const result = await putR2Object({
      key: objectKey,
      body: file.buffer,
      contentType: file.mimetype,
      cacheControl: 'public, max-age=86400',
    });
    uploaded = {
      logo_url: result.file_url,
      logo_storage_key: result.storage_key,
    };
  } else if (env.NODE_ENV === 'production') {
    throw new AppError(
      503,
      'R2_NOT_CONFIGURED',
      'Cloudflare R2 is required for logo uploads in production',
    );
  } else {
    console.warn('[settings] R2 not configured — storing logo in Supabase course-thumbnails');
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage
      .from(FALLBACK_BUCKET)
      .upload(objectKey, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });
    if (error) {
      throw new AppError(500, 'LOGO_UPLOAD_FAILED', error.message);
    }
    const { data } = supabase.storage.from(FALLBACK_BUCKET).getPublicUrl(objectKey);
    uploaded = {
      logo_url: data.publicUrl,
      logo_storage_key: `supabase:${objectKey}`,
    };
  }

  const current = await getPlatformSettings({ bypassCache: true });
  return updatePlatformSettings({
    general: {
      ...current.general,
      logo_url: uploaded.logo_url,
      logo_storage_key: uploaded.logo_storage_key,
    },
    actor_id: input.actor_id,
    actor_email: input.actor_email,
  });
}
