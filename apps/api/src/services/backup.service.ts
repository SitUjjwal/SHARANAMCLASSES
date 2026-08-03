/**
 * Module 12 Backup service — JSON/gzip snapshots to Cloudflare R2.
 *
 * Components of a backup archive:
 *   settings     → platform_settings rows
 *   database     → critical catalog / ops tables (paginated)
 *   r2_metadata  → storage_key / file_url inventory (not binary blobs)
 */
import { gunzipSync, gzipSync } from 'node:zlib';
import { randomUUID } from 'node:crypto';

import type {
  BackupArchivePayload,
  BackupJob,
  BackupOverview,
  BackupRestoreMode,
  BackupRestoreResult,
  BackupRun,
  BackupTrigger,
} from '@sharanam/shared';

import { env } from '../config/env';
import { getSupabaseAdmin } from '../config/supabase';
import {
  createSignedR2Url,
  getR2ObjectBuffer,
  isR2Configured,
  putR2Object,
} from '../integrations/r2/client';
import { AppError } from '../utils/AppError';

const PAGE_SIZE = 500;

/** Tables exported for "Database Backup" (logical JSON dump via PostgREST). */
export const BACKUP_DB_TABLES = [
  'categories',
  'courses',
  'chapters',
  'videos',
  'pdfs',
  'notes',
  'live_classes',
  'banners',
  'announcements',
  'faqs',
  'tests',
  'questions',
  'teachers',
  'certificates',
  'payment_orders',
  'enrollments',
] as const;

const JOB_COLUMNS =
  'id, name, enabled, cron, timezone, include_db, include_r2_metadata, include_settings, retain_days, created_at, updated_at';

const RUN_COLUMNS =
  'id, job_id, trigger, status, started_at, finished_at, actor_id, storage_key, manifest_storage_key, file_url, byte_size, tables_exported, row_counts, r2_keys_count, error_message, metadata';

function parseBoolEnv(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  const v = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(v)) return true;
  if (['0', 'false', 'no', 'off'].includes(v)) return false;
  return fallback;
}

export function getBackupEngineConfig() {
  return {
    enabled: parseBoolEnv(env.BACKUP_ENGINE_ENABLED, env.NODE_ENV !== 'test'),
    cron: env.BACKUP_ENGINE_CRON || '0 2 * * *',
    timezone: env.BACKUP_ENGINE_TZ || 'Asia/Kolkata',
    retainDays: env.BACKUP_RETAIN_DAYS || 30,
  };
}

async function exportTable(table: string): Promise<Record<string, unknown>[]> {
  const supabase = getSupabaseAdmin();
  const rows: Record<string, unknown>[] = [];
  let from = 0;

  for (;;) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase.from(table).select('*').range(from, to);
    if (error) {
      // Table may not exist in every environment — skip rather than fail whole backup.
      if (/does not exist|relation|Could not find/i.test(error.message)) {
        return rows;
      }
      throw new AppError(500, 'BACKUP_TABLE_EXPORT_FAILED', `${table}: ${error.message}`);
    }
    const batch = (data ?? []) as Record<string, unknown>[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

async function exportSettings(): Promise<Record<string, unknown>[]> {
  return exportTable('platform_settings');
}

async function exportR2Metadata(): Promise<BackupArchivePayload['r2_metadata']> {
  const out: BackupArchivePayload['r2_metadata'] = [];

  const pdfs = await exportTable('pdfs');
  for (const row of pdfs) {
    out.push({
      source_table: 'pdfs',
      id: String(row.id),
      storage_key: (row.storage_key as string | null) ?? null,
      file_url: (row.file_url as string | null) ?? null,
      extra: {
        title: row.title,
        course_id: row.course_id,
        chapter_id: row.chapter_id,
      },
    });
  }

  const profiles = await exportTable('profiles');
  for (const row of profiles) {
    const key = (row.avatar_storage_key as string | null) ?? null;
    if (!key && !(row.avatar_url as string | null)) continue;
    out.push({
      source_table: 'profiles',
      id: String(row.id),
      storage_key: key,
      file_url: (row.avatar_url as string | null) ?? null,
    });
  }

  const certs = await exportTable('certificates');
  for (const row of certs) {
    out.push({
      source_table: 'certificates',
      id: String(row.id),
      storage_key: (row.storage_key as string | null) ?? null,
      file_url: (row.certificate_url as string | null) ?? null,
    });
  }

  const bugs = await exportTable('bug_reports');
  for (const row of bugs) {
    const key = (row.screenshot_storage_key as string | null) ?? null;
    if (!key) continue;
    out.push({
      source_table: 'bug_reports',
      id: String(row.id),
      storage_key: key,
      file_url: (row.screenshot_url as string | null) ?? null,
    });
  }

  const settings = await exportSettings();
  for (const row of settings) {
    if (row.key !== 'general') continue;
    const value = (row.value ?? {}) as Record<string, unknown>;
    const logoKey = (value.logo_storage_key as string | null) ?? null;
    if (!logoKey && !(value.logo_url as string | null)) continue;
    out.push({
      source_table: 'platform_settings',
      id: 'general',
      storage_key: logoKey,
      file_url: (value.logo_url as string | null) ?? null,
    });
  }

  return out.filter((r) => Boolean(r.storage_key || r.file_url));
}

function toJob(row: Record<string, unknown>): BackupJob {
  return {
    id: row.id as string,
    name: row.name as string,
    enabled: Boolean(row.enabled),
    cron: row.cron as string,
    timezone: row.timezone as string,
    include_db: Boolean(row.include_db),
    include_r2_metadata: Boolean(row.include_r2_metadata),
    include_settings: Boolean(row.include_settings),
    retain_days: Number(row.retain_days) || 30,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function toRun(row: Record<string, unknown>): BackupRun {
  return {
    id: row.id as string,
    job_id: (row.job_id as string | null) ?? null,
    trigger: row.trigger as BackupTrigger,
    status: row.status as BackupRun['status'],
    started_at: row.started_at as string,
    finished_at: (row.finished_at as string | null) ?? null,
    actor_id: (row.actor_id as string | null) ?? null,
    storage_key: (row.storage_key as string | null) ?? null,
    manifest_storage_key: (row.manifest_storage_key as string | null) ?? null,
    file_url: (row.file_url as string | null) ?? null,
    byte_size: row.byte_size == null ? null : Number(row.byte_size),
    tables_exported: (row.tables_exported as string[]) ?? [],
    row_counts: (row.row_counts as Record<string, number>) ?? {},
    r2_keys_count: Number(row.r2_keys_count) || 0,
    error_message: (row.error_message as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  };
}

export async function ensureDefaultBackupJob(): Promise<BackupJob> {
  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from('backup_jobs')
    .select(JOB_COLUMNS)
    .eq('name', 'default')
    .maybeSingle();

  if (existing) return toJob(existing as Record<string, unknown>);

  const engine = getBackupEngineConfig();
  const { data, error } = await supabase
    .from('backup_jobs')
    .insert({
      name: 'default',
      enabled: true,
      cron: engine.cron,
      timezone: engine.timezone,
      retain_days: engine.retainDays,
      updated_at: new Date().toISOString(),
    })
    .select(JOB_COLUMNS)
    .single();

  if (error || !data) {
    throw new AppError(500, 'BACKUP_JOB_CREATE_FAILED', error?.message || 'Could not create backup job');
  }
  return toJob(data as Record<string, unknown>);
}

export async function getBackupJob(): Promise<BackupJob> {
  return ensureDefaultBackupJob();
}

export async function updateBackupJob(input: {
  enabled?: boolean;
  cron?: string;
  timezone?: string;
  include_db?: boolean;
  include_r2_metadata?: boolean;
  include_settings?: boolean;
  retain_days?: number;
}): Promise<BackupJob> {
  const job = await ensureDefaultBackupJob();
  const supabase = getSupabaseAdmin();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.enabled !== undefined) patch.enabled = input.enabled;
  if (input.cron !== undefined) patch.cron = input.cron.trim();
  if (input.timezone !== undefined) patch.timezone = input.timezone.trim();
  if (input.include_db !== undefined) patch.include_db = input.include_db;
  if (input.include_r2_metadata !== undefined) patch.include_r2_metadata = input.include_r2_metadata;
  if (input.include_settings !== undefined) patch.include_settings = input.include_settings;
  if (input.retain_days !== undefined) patch.retain_days = input.retain_days;

  const { data, error } = await supabase
    .from('backup_jobs')
    .update(patch)
    .eq('id', job.id)
    .select(JOB_COLUMNS)
    .single();

  if (error || !data) {
    throw new AppError(400, 'BACKUP_JOB_UPDATE_FAILED', error?.message || 'Update failed');
  }
  return toJob(data as Record<string, unknown>);
}

export async function listBackupRuns(limit = 20): Promise<BackupRun[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('backup_runs')
    .select(RUN_COLUMNS)
    .order('started_at', { ascending: false })
    .limit(Math.min(100, Math.max(1, limit)));

  if (error) {
    throw new AppError(500, 'BACKUP_RUNS_FETCH_FAILED', error.message);
  }

  const runs = ((data ?? []) as Record<string, unknown>[]).map(toRun);
  return Promise.all(
    runs.map(async (run) => {
      if (!run.storage_key || !isR2Configured()) return run;
      try {
        const signed = await createSignedR2Url(run.storage_key, 3600);
        return {
          ...run,
          download_url: signed.url,
          download_url_expires_at: signed.expires_at,
        };
      } catch {
        return run;
      }
    }),
  );
}

export async function getBackupOverview(): Promise<BackupOverview> {
  const engine = getBackupEngineConfig();
  let job: BackupJob | null = null;
  let recent_runs: BackupRun[] = [];

  try {
    job = await ensureDefaultBackupJob();
    recent_runs = await listBackupRuns(15);
  } catch (err) {
    // Tables may not be migrated yet — still return engine config for the UI.
    if (!(err instanceof AppError)) throw err;
  }

  const lastSuccess = recent_runs.find((r) => r.status === 'succeeded');

  return {
    job,
    recent_runs,
    last_success_at: lastSuccess?.finished_at ?? lastSuccess?.started_at ?? null,
    engine: {
      enabled: engine.enabled,
      cron: job?.cron ?? engine.cron,
      timezone: job?.timezone ?? engine.timezone,
    },
  };
}

let backupInFlight = false;

export async function runBackup(input: {
  trigger: BackupTrigger;
  actorId?: string | null;
  jobId?: string | null;
}): Promise<BackupRun> {
  if (backupInFlight) {
    throw new AppError(409, 'BACKUP_IN_PROGRESS', 'Another backup is already running');
  }
  if (!isR2Configured()) {
    throw new AppError(
      503,
      'R2_NOT_CONFIGURED',
      'Cloudflare R2 must be configured to store backup archives',
    );
  }

  backupInFlight = true;
  const supabase = getSupabaseAdmin();
  const job = await ensureDefaultBackupJob();
  const runId = randomUUID();
  const startedAt = new Date().toISOString();

  const { error: insertError } = await supabase.from('backup_runs').insert({
    id: runId,
    job_id: input.jobId ?? job.id,
    trigger: input.trigger,
    status: 'running',
    started_at: startedAt,
    actor_id: input.actorId ?? null,
  });

  if (insertError) {
    backupInFlight = false;
    throw new AppError(500, 'BACKUP_RUN_CREATE_FAILED', insertError.message);
  }

  try {
    const includeSettings = job.include_settings;
    const includeDb = job.include_db;
    const includeR2 = job.include_r2_metadata;

    const settings = includeSettings ? await exportSettings() : [];
    const database: BackupArchivePayload['database'] = {};
    const tablesExported: string[] = [];
    const rowCounts: Record<string, number> = {};

    if (includeDb) {
      for (const table of BACKUP_DB_TABLES) {
        const rows = await exportTable(table);
        database[table] = rows;
        tablesExported.push(table);
        rowCounts[table] = rows.length;
      }
    }

    if (includeSettings) {
      rowCounts.platform_settings = settings.length;
      tablesExported.push('platform_settings');
    }

    const r2_metadata = includeR2 ? await exportR2Metadata() : [];
    rowCounts.r2_metadata = r2_metadata.length;

    const manifest: BackupArchivePayload['manifest'] = {
      version: 1,
      created_at: startedAt,
      trigger: input.trigger,
      run_id: runId,
      includes: {
        settings: includeSettings,
        database: includeDb,
        r2_metadata: includeR2,
      },
      tables: tablesExported,
      row_counts: rowCounts,
      r2_keys_count: r2_metadata.filter((r) => r.storage_key).length,
      gzip: true,
    };

    const payload: BackupArchivePayload = {
      manifest,
      settings,
      database,
      r2_metadata,
    };

    const json = Buffer.from(JSON.stringify(payload), 'utf8');
    const gzipped = gzipSync(json);
    const stamp = startedAt.replace(/[:.]/g, '-');
    const prefix = `backups/${stamp.slice(0, 7)}/${runId}`;
    const archiveKey = `${prefix}/backup.json.gz`;
    const manifestKey = `${prefix}/manifest.json`;

    const uploaded = await putR2Object({
      key: archiveKey,
      body: gzipped,
      contentType: 'application/gzip',
      cacheControl: 'private, max-age=0',
      metadata: {
        'backup-run-id': runId,
        'backup-trigger': input.trigger,
      },
    });

    await putR2Object({
      key: manifestKey,
      body: Buffer.from(JSON.stringify(manifest, null, 2), 'utf8'),
      contentType: 'application/json',
      cacheControl: 'private, max-age=0',
    });

    const finishedAt = new Date().toISOString();
    const { data: updated, error: updateError } = await supabase
      .from('backup_runs')
      .update({
        status: 'succeeded',
        finished_at: finishedAt,
        storage_key: archiveKey,
        manifest_storage_key: manifestKey,
        file_url: uploaded.file_url,
        byte_size: gzipped.byteLength,
        tables_exported: tablesExported,
        row_counts: rowCounts,
        r2_keys_count: manifest.r2_keys_count,
        metadata: {
          gzip: true,
          uncompressed_bytes: json.byteLength,
        },
      })
      .eq('id', runId)
      .select(RUN_COLUMNS)
      .single();

    if (updateError || !updated) {
      throw new AppError(500, 'BACKUP_RUN_UPDATE_FAILED', updateError?.message || 'Failed to finalize');
    }

    await pruneOldBackups(job.retain_days).catch(() => undefined);

    const run = toRun(updated as Record<string, unknown>);
    try {
      const signed = await createSignedR2Url(archiveKey, 3600);
      run.download_url = signed.url;
      run.download_url_expires_at = signed.expires_at;
    } catch {
      // ignore
    }
    return run;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase
      .from('backup_runs')
      .update({
        status: 'failed',
        finished_at: new Date().toISOString(),
        error_message: message.slice(0, 1000),
      })
      .eq('id', runId);
    throw err instanceof AppError
      ? err
      : new AppError(500, 'BACKUP_FAILED', message);
  } finally {
    backupInFlight = false;
  }
}

async function pruneOldBackups(retainDays: number): Promise<void> {
  const supabase = getSupabaseAdmin();
  const cutoff = new Date(Date.now() - retainDays * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('backup_runs')
    .select('id, storage_key, manifest_storage_key')
    .lt('started_at', cutoff)
    .limit(50);

  for (const row of data ?? []) {
    if (row.storage_key) {
      const { deleteR2Object } = await import('../integrations/r2/client');
      await deleteR2Object(row.storage_key as string);
    }
    if (row.manifest_storage_key) {
      const { deleteR2Object } = await import('../integrations/r2/client');
      await deleteR2Object(row.manifest_storage_key as string);
    }
    await supabase.from('backup_runs').delete().eq('id', row.id);
  }
}

async function loadArchive(runId: string): Promise<BackupArchivePayload> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('backup_runs')
    .select(RUN_COLUMNS)
    .eq('id', runId)
    .maybeSingle();

  if (error) throw new AppError(500, 'BACKUP_RUN_FETCH_FAILED', error.message);
  if (!data) throw new AppError(404, 'BACKUP_RUN_NOT_FOUND', 'Backup run not found');
  if (data.status !== 'succeeded' || !data.storage_key) {
    throw new AppError(400, 'BACKUP_NOT_RESTORABLE', 'Only successful backups with an archive can be restored');
  }

  const { body } = await getR2ObjectBuffer(data.storage_key as string);
  let jsonText: string;
  try {
    jsonText = gunzipSync(body).toString('utf8');
  } catch {
    jsonText = body.toString('utf8');
  }

  const parsed = JSON.parse(jsonText) as BackupArchivePayload;
  if (!parsed?.manifest || parsed.manifest.version !== 1) {
    throw new AppError(400, 'BACKUP_INVALID', 'Backup archive format is invalid');
  }
  return parsed;
}

export async function restoreBackup(input: {
  runId: string;
  mode: BackupRestoreMode;
}): Promise<BackupRestoreResult> {
  const archive = await loadArchive(input.runId);
  const supabase = getSupabaseAdmin();
  const warnings: string[] = [];
  let settingsRestored = 0;
  let r2Updated = 0;

  if (input.mode === 'settings' || input.mode === 'settings_and_r2_metadata') {
    for (const row of archive.settings ?? []) {
      const key = row.key as string | undefined;
      if (!key) continue;
      const { error } = await supabase.from('platform_settings').upsert(
        {
          key,
          value: row.value ?? {},
          updated_at: new Date().toISOString(),
          updated_by: (row.updated_by as string | null) ?? null,
        },
        { onConflict: 'key' },
      );
      if (error) {
        warnings.push(`settings:${key}: ${error.message}`);
      } else {
        settingsRestored += 1;
      }
    }
  }

  if (input.mode === 'settings_and_r2_metadata') {
    for (const item of archive.r2_metadata ?? []) {
      if (!item.storage_key && !item.file_url) continue;
      try {
        if (item.source_table === 'pdfs') {
          const { error } = await supabase
            .from('pdfs')
            .update({
              storage_key: item.storage_key,
              file_url: item.file_url ?? undefined,
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.id);
          if (error) warnings.push(`pdfs:${item.id}: ${error.message}`);
          else r2Updated += 1;
        } else if (item.source_table === 'profiles') {
          const { error } = await supabase
            .from('profiles')
            .update({
              avatar_storage_key: item.storage_key,
              avatar_url: item.file_url ?? undefined,
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.id);
          if (error) warnings.push(`profiles:${item.id}: ${error.message}`);
          else r2Updated += 1;
        } else if (item.source_table === 'certificates') {
          const { error } = await supabase
            .from('certificates')
            .update({
              storage_key: item.storage_key,
              certificate_url: item.file_url ?? undefined,
            })
            .eq('id', item.id);
          if (error) warnings.push(`certificates:${item.id}: ${error.message}`);
          else r2Updated += 1;
        } else if (item.source_table === 'platform_settings' && item.id === 'general') {
          const { data: existing } = await supabase
            .from('platform_settings')
            .select('value')
            .eq('key', 'general')
            .maybeSingle();
          const value = {
            ...((existing?.value as Record<string, unknown>) ?? {}),
            logo_storage_key: item.storage_key,
            logo_url: item.file_url ?? undefined,
          };
          const { error } = await supabase
            .from('platform_settings')
            .update({ value, updated_at: new Date().toISOString() })
            .eq('key', 'general');
          if (error) warnings.push(`logo: ${error.message}`);
          else r2Updated += 1;
        } else {
          warnings.push(`Skipped unsupported metadata table: ${item.source_table}`);
        }
      } catch (err) {
        warnings.push(
          `${item.source_table}:${item.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  return {
    mode: input.mode,
    settings_restored: settingsRestored,
    r2_metadata_updated: r2Updated,
    warnings,
  };
}
