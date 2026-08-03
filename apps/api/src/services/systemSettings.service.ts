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

import { env, isR2Configured } from '../config/env';
import { getSupabaseAdmin } from '../config/supabase';
import { securePutToR2 } from '../integrations/r2/client';
import {
  buildContentAddressedKey,
  UPLOAD_PROFILES,
  validateSecureUpload,
} from '../integrations/r2/fileSecurity';
import { AppError } from '../utils/AppError';
import { writeActivityLog } from './activityLog.service';

const SETTINGS_KEY = 'general';
const TZ = 'Asia/Kolkata';
const FALLBACK_BUCKET = 'course-thumbnails';

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
  social_facebook: '',
  social_instagram: '',
  social_telegram: '',
  social_youtube: '',
  social_whatsapp: '',
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
    social_facebook: asString(v.social_facebook, DEFAULT_GENERAL.social_facebook),
    social_instagram: asString(v.social_instagram, DEFAULT_GENERAL.social_instagram),
    social_telegram: asString(v.social_telegram, DEFAULT_GENERAL.social_telegram),
    social_youtube: asString(v.social_youtube, DEFAULT_GENERAL.social_youtube),
    social_whatsapp: asString(v.social_whatsapp, DEFAULT_GENERAL.social_whatsapp),
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
    social_facebook: g.social_facebook,
    social_instagram: g.social_instagram,
    social_telegram: g.social_telegram,
    social_youtube: g.social_youtube,
    social_whatsapp: g.social_whatsapp,
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

/**
 * Upload platform logo → R2 (Supabase fallback in non-production).
 * SVG rejected (XSS). JPEG/PNG/WebP only after magic + metadata scan.
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
  const validated = validateSecureUpload(file, UPLOAD_PROFILES.logo);

  let uploaded: PlatformLogoUploadResult;

  if (isR2Configured()) {
    const result = await securePutToR2({
      file,
      kind: 'logo',
      prefix: 'branding/logo',
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
    const objectKey = buildContentAddressedKey(
      'branding/logo',
      validated.contentHash,
      validated.extension,
    );
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage
      .from(FALLBACK_BUCKET)
      .upload(objectKey, validated.buffer, {
        contentType: validated.mimeType,
        upsert: false,
      });
    if (error) {
      const msg = error.message.toLowerCase();
      if (!msg.includes('already exists') && !msg.includes('duplicate')) {
        throw new AppError(500, 'LOGO_UPLOAD_FAILED', error.message);
      }
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
