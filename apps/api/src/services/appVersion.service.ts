/**
 * App version history + public version check.
 */
import type {
  AppVersionCheckResult,
  AppVersionHistoryEntry,
  AppVersionPolicyConfig,
  CreateAppVersionReleaseInput,
  PlatformGeneralSettings,
} from '@sharanam/shared';
import { evaluateAppUpdate, isValidSemver, normalizeSemver } from '@sharanam/shared';

import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import { writeActivityLog } from './activityLog.service';
import {
  getPlatformSettings,
  invalidateSettingsCache,
  parseGeneral,
  updatePlatformSettings,
} from './systemSettings.service';

const HISTORY_SELECT =
  'id, version, android_build_number, ios_build_number, release_notes, force_update, published_at, created_by, created_at';

function toPolicy(g: PlatformGeneralSettings): AppVersionPolicyConfig {
  return {
    app_version: g.app_version,
    min_app_version: g.min_app_version,
    recommended_app_version: g.recommended_app_version,
    force_update: g.force_update,
    optional_update: g.optional_update,
    release_notes: g.release_notes,
    android_build_number: g.android_build_number,
    ios_build_number: g.ios_build_number,
    store_url_android: g.store_url_android,
    store_url_ios: g.store_url_ios,
  };
}

function mapRow(row: Record<string, unknown>): AppVersionHistoryEntry {
  return {
    id: String(row.id),
    version: String(row.version),
    android_build_number:
      row.android_build_number === null || row.android_build_number === undefined
        ? null
        : Number(row.android_build_number),
    ios_build_number:
      row.ios_build_number === null || row.ios_build_number === undefined
        ? null
        : String(row.ios_build_number),
    release_notes: typeof row.release_notes === 'string' ? row.release_notes : '',
    force_update: Boolean(row.force_update),
    published_at: String(row.published_at),
    created_by: row.created_by ? String(row.created_by) : null,
    created_at: String(row.created_at),
  };
}

export async function checkClientAppVersion(input: {
  client_version: string;
  platform?: string;
  build_number?: string | number | null;
}): Promise<AppVersionCheckResult> {
  const normalized = normalizeSemver(input.client_version);
  if (!normalized) {
    throw new AppError(
      400,
      'INVALID_CLIENT_VERSION',
      'client_version must be SemVer MAJOR.MINOR.PATCH',
    );
  }
  const bundle = await getPlatformSettings();
  return evaluateAppUpdate(normalized, toPolicy(bundle.general), {
    platform: input.platform,
  });
}

/** Public live version snapshot for GET /version */
export async function getPublicVersionInfo(): Promise<{
  version: string;
  min_app_version: string;
  recommended_app_version: string;
  android_build_number: number;
  ios_build_number: string;
  force_update: boolean;
  optional_update: boolean;
  store_url_android: string;
  store_url_ios: string;
  updated_at: string | null;
}> {
  const bundle = await getPlatformSettings();
  const g = bundle.general;
  return {
    version: g.app_version,
    min_app_version: g.min_app_version,
    recommended_app_version: g.recommended_app_version || g.app_version,
    android_build_number: g.android_build_number,
    ios_build_number: g.ios_build_number,
    force_update: g.force_update,
    optional_update: g.optional_update,
    store_url_android: g.store_url_android,
    store_url_ios: g.store_url_ios,
    updated_at: bundle.updated_at,
  };
}

/** Public release notes for GET /release-notes (?version= optional) */
export async function getPublicReleaseNotes(opts: {
  version?: string;
  limit?: number;
} = {}): Promise<{
  version: string;
  release_notes: string;
  android_build_number: number | null;
  ios_build_number: string | null;
  force_update: boolean;
  published_at: string | null;
  history: Array<{
    version: string;
    release_notes: string;
    android_build_number: number | null;
    ios_build_number: string | null;
    force_update: boolean;
    published_at: string;
  }>;
}> {
  const bundle = await getPlatformSettings();
  const g = bundle.general;
  const history = await listAppVersionHistory(opts.limit ?? 20);

  const requested = opts.version ? normalizeSemver(opts.version) : null;
  if (opts.version && !requested) {
    throw new AppError(400, 'INVALID_VERSION', 'version must be SemVer MAJOR.MINOR.PATCH');
  }

  const fromHistory = requested
    ? history.find((h) => h.version === requested)
    : history.find((h) => h.version === g.app_version) ?? history[0];

  if (fromHistory) {
    return {
      version: fromHistory.version,
      release_notes: fromHistory.release_notes,
      android_build_number: fromHistory.android_build_number,
      ios_build_number: fromHistory.ios_build_number,
      force_update: fromHistory.force_update,
      published_at: fromHistory.published_at,
      history: history.map((h) => ({
        version: h.version,
        release_notes: h.release_notes,
        android_build_number: h.android_build_number,
        ios_build_number: h.ios_build_number,
        force_update: h.force_update,
        published_at: h.published_at,
      })),
    };
  }

  // Fallback to live settings when history table empty / migration pending
  return {
    version: requested ?? g.app_version,
    release_notes: g.release_notes,
    android_build_number: g.android_build_number,
    ios_build_number: g.ios_build_number,
    force_update: g.force_update,
    published_at: bundle.updated_at,
    history: [],
  };
}

export async function listAppVersionHistory(limit = 50): Promise<AppVersionHistoryEntry[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('app_version_history')
    .select(HISTORY_SELECT)
    .order('published_at', { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 100));

  if (error) {
    if (error.message.toLowerCase().includes('does not exist')) {
      return [];
    }
    throw new AppError(500, 'VERSION_HISTORY_READ_FAILED', error.message);
  }
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function publishAppVersionRelease(input: {
  body: CreateAppVersionReleaseInput;
  actor_id: string;
  actor_email: string | null;
}): Promise<{
  entry: AppVersionHistoryEntry;
  settings: Awaited<ReturnType<typeof getPlatformSettings>> | null;
}> {
  const version = normalizeSemver(input.body.version);
  if (!version || !isValidSemver(version)) {
    throw new AppError(400, 'INVALID_VERSION', 'version must be SemVer MAJOR.MINOR.PATCH');
  }

  const release_notes = (input.body.release_notes ?? '').trim();
  const force_update = Boolean(input.body.force_update);
  const android_build_number =
    input.body.android_build_number === undefined || input.body.android_build_number === null
      ? null
      : Math.floor(Number(input.body.android_build_number));
  const ios_build_number =
    input.body.ios_build_number === undefined || input.body.ios_build_number === null
      ? null
      : String(input.body.ios_build_number).trim() || null;

  if (android_build_number !== null && (!Number.isFinite(android_build_number) || android_build_number < 1)) {
    throw new AppError(400, 'INVALID_BUILD', 'android_build_number must be a positive integer');
  }

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('app_version_history')
    .upsert(
      {
        version,
        android_build_number,
        ios_build_number,
        release_notes,
        force_update,
        published_at: now,
        created_by: input.actor_id,
        created_at: now,
      },
      { onConflict: 'version' },
    )
    .select(HISTORY_SELECT)
    .single();

  if (error) {
    throw new AppError(500, 'VERSION_HISTORY_WRITE_FAILED', error.message);
  }

  const entry = mapRow(data as Record<string, unknown>);

  let settings: Awaited<ReturnType<typeof getPlatformSettings>> | null = null;
  const publish = input.body.publish_as_current !== false;

  if (publish) {
    const current = await getPlatformSettings({ bypassCache: true });
    const nextGeneral = parseGeneral({
      ...current.general,
      app_version: version,
      min_app_version: input.body.min_app_version
        ? normalizeSemver(input.body.min_app_version) ?? current.general.min_app_version
        : current.general.min_app_version,
      recommended_app_version: input.body.recommended_app_version
        ? normalizeSemver(input.body.recommended_app_version) ?? version
        : version,
      force_update,
      optional_update:
        input.body.optional_update === undefined
          ? current.general.optional_update
          : Boolean(input.body.optional_update),
      release_notes,
      android_build_number: android_build_number ?? current.general.android_build_number,
      ios_build_number: ios_build_number ?? current.general.ios_build_number,
      store_url_android: input.body.store_url_android ?? current.general.store_url_android,
      store_url_ios: input.body.store_url_ios ?? current.general.store_url_ios,
    });

    settings = await updatePlatformSettings({
      general: nextGeneral,
      actor_id: input.actor_id,
      actor_email: input.actor_email,
    });
    invalidateSettingsCache();
  }

  await writeActivityLog({
    actor_id: input.actor_id,
    actor_email: input.actor_email,
    action: 'app_version.publish',
    entity_type: 'app_version_history',
    entity_id: entry.id,
    summary: `Published app version ${version}`,
    metadata: {
      version,
      force_update,
      android_build_number,
      ios_build_number,
      publish_as_current: publish,
    },
  });

  return { entry, settings };
}
