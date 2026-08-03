/**
 * Module 12 — Backup system shared types.
 */
export type BackupTrigger = 'cron' | 'manual';

export type BackupRunStatus =
  | 'pending'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'partial';

export type BackupJob = {
  id: string;
  name: string;
  enabled: boolean;
  cron: string;
  timezone: string;
  include_db: boolean;
  include_r2_metadata: boolean;
  include_settings: boolean;
  retain_days: number;
  created_at: string;
  updated_at: string;
};

export type BackupRun = {
  id: string;
  job_id: string | null;
  trigger: BackupTrigger;
  status: BackupRunStatus;
  started_at: string;
  finished_at: string | null;
  actor_id: string | null;
  storage_key: string | null;
  manifest_storage_key: string | null;
  file_url: string | null;
  byte_size: number | null;
  tables_exported: string[];
  row_counts: Record<string, number>;
  r2_keys_count: number;
  error_message: string | null;
  metadata: Record<string, unknown>;
  /** Present on list responses when a signed download URL was minted */
  download_url?: string | null;
  download_url_expires_at?: string | null;
};

export type BackupRestoreMode = 'settings' | 'settings_and_r2_metadata';

export type BackupOverview = {
  job: BackupJob | null;
  recent_runs: BackupRun[];
  last_success_at: string | null;
  engine: {
    enabled: boolean;
    cron: string;
    timezone: string;
  };
};

export type BackupArchiveManifest = {
  version: 1;
  created_at: string;
  trigger: BackupTrigger;
  run_id: string;
  includes: {
    settings: boolean;
    database: boolean;
    r2_metadata: boolean;
  };
  tables: string[];
  row_counts: Record<string, number>;
  r2_keys_count: number;
  gzip: boolean;
};

export type BackupArchivePayload = {
  manifest: BackupArchiveManifest;
  settings: Array<Record<string, unknown>>;
  database: Record<string, Array<Record<string, unknown>>>;
  r2_metadata: Array<{
    source_table: string;
    id: string;
    storage_key: string | null;
    file_url?: string | null;
    extra?: Record<string, unknown>;
  }>;
};

export type BackupRestoreResult = {
  mode: BackupRestoreMode;
  settings_restored: number;
  r2_metadata_updated: number;
  warnings: string[];
};
