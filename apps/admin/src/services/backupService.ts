/**
 * Admin backup API client — Module 12.
 */
import type {
  BackupJob,
  BackupOverview,
  BackupRestoreMode,
  BackupRestoreResult,
  BackupRun,
} from '@sharanam/shared';

import { apiRequest } from '@/services/api';

export function fetchBackupOverview() {
  return apiRequest<BackupOverview>('/admin/backups/overview');
}

export function runManualBackup() {
  return apiRequest<BackupRun>('/admin/backups/run', { method: 'POST', body: {} });
}

export function updateBackupJob(payload: Partial<{
  enabled: boolean;
  cron: string;
  timezone: string;
  include_db: boolean;
  include_r2_metadata: boolean;
  include_settings: boolean;
  retain_days: number;
}>) {
  return apiRequest<BackupJob>('/admin/backups/job', {
    method: 'PATCH',
    body: payload,
  });
}

export function restoreBackupRun(runId: string, mode: BackupRestoreMode) {
  return apiRequest<BackupRestoreResult>(`/admin/backups/${runId}/restore`, {
    method: 'POST',
    body: { mode },
  });
}
