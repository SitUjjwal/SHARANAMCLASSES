/**
 * BackupsPage — Module 12: manual / scheduled backups + restore.
 */
import { FormEvent, useCallback, useEffect, useState } from 'react';

import type { BackupOverview, BackupRun } from '@sharanam/shared';

import { DashboardCard } from '@/components/DashboardCard';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  fetchBackupOverview,
  restoreBackupRun,
  runManualBackup,
  updateBackupJob,
} from '@/services/backupService';
import { ApiClientError } from '@/services/api';

function formatBytes(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function statusTone(status: BackupRun['status']): 'default' | 'success' | 'warn' | 'accent' {
  if (status === 'succeeded') return 'success';
  if (status === 'failed') return 'warn';
  if (status === 'running' || status === 'pending') return 'accent';
  return 'default';
}

export function BackupsPage() {
  const { can } = useAuth();
  const canWrite = can('settings:update');
  const [data, setData] = useState<BackupOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [enabled, setEnabled] = useState(true);
  const [cron, setCron] = useState('0 2 * * *');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [includeDb, setIncludeDb] = useState(true);
  const [includeR2, setIncludeR2] = useState(true);
  const [includeSettings, setIncludeSettings] = useState(true);
  const [retainDays, setRetainDays] = useState(30);

  const load = useCallback(async () => {
    if (!can('settings:read')) {
      setLoading(false);
      setError('You do not have permission to view backups.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const overview = await fetchBackupOverview();
      setData(overview);
      if (overview.job) {
        setEnabled(overview.job.enabled);
        setCron(overview.job.cron);
        setTimezone(overview.job.timezone);
        setIncludeDb(overview.job.include_db);
        setIncludeR2(overview.job.include_r2_metadata);
        setIncludeSettings(overview.job.include_settings);
        setRetainDays(overview.job.retain_days);
      } else {
        setCron(overview.engine.cron);
        setTimezone(overview.engine.timezone);
        setEnabled(overview.engine.enabled);
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load backups');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [can]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSaveSchedule(event: FormEvent) {
    event.preventDefault();
    if (!canWrite) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await updateBackupJob({
        enabled,
        cron,
        timezone,
        include_db: includeDb,
        include_r2_metadata: includeR2,
        include_settings: includeSettings,
        retain_days: retainDays,
      });
      setMessage('Backup schedule saved.');
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to save schedule');
    } finally {
      setBusy(false);
    }
  }

  async function onRunNow() {
    if (!canWrite) return;
    const ok = window.confirm(
      'Run a backup now?\n\nThis exports settings, database tables, and R2 metadata to Cloudflare R2.',
    );
    if (!ok) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const run = await runManualBackup();
      setMessage(`Backup ${run.status}: ${formatBytes(run.byte_size)}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Backup failed');
    } finally {
      setBusy(false);
    }
  }

  async function onRestore(run: BackupRun, mode: 'settings' | 'settings_and_r2_metadata') {
    if (!canWrite) return;
    const label =
      mode === 'settings'
        ? 'Restore platform settings only'
        : 'Restore settings + R2 metadata pointers';
    const ok = window.confirm(
      `${label} from backup ${run.id.slice(0, 8)}…?\n\nThis overwrites live settings/metadata. Full table restore is intentionally not offered here.`,
    );
    if (!ok) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await restoreBackupRun(run.id, mode);
      setMessage(
        `Restored: ${result.settings_restored} settings, ${result.r2_metadata_updated} metadata rows` +
          (result.warnings.length ? ` · ${result.warnings.length} warnings` : ''),
      );
      if (result.warnings.length) {
        console.warn('[backup restore warnings]', result.warnings);
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Restore failed');
    } finally {
      setBusy(false);
    }
  }

  if (!can('settings:read')) {
    return (
      <div className="page">
        <PageHeader title="Backups" description="Access restricted." />
        <p className="form-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="Backups"
        description="Database JSON snapshot · R2 metadata · platform settings · scheduled + manual · restore"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn" onClick={() => void load()} disabled={loading || busy}>
              Refresh
            </button>
            {canWrite ? (
              <button
                type="button"
                className="btn primary"
                onClick={() => void onRunNow()}
                disabled={busy}
              >
                {busy ? 'Working…' : 'Run backup now'}
              </button>
            ) : null}
          </div>
        }
      />

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="hint">{message}</p> : null}
      {loading && !data ? <p className="hint">Loading backups…</p> : null}

      {data ? (
        <>
          <section className="dash-kpi-grid" aria-label="Backup status">
            <DashboardCard
              label="Scheduler"
              value={data.engine.enabled ? 'On' : 'Off'}
              hint={`${data.engine.cron} · ${data.engine.timezone}`}
              tone={data.engine.enabled ? 'success' : 'warn'}
            />
            <DashboardCard
              label="Last success"
              value={
                data.last_success_at
                  ? new Date(data.last_success_at).toLocaleString('en-IN')
                  : 'Never'
              }
            />
            <DashboardCard
              label="Recent runs"
              value={data.recent_runs.length}
              hint="Stored in backup_runs + R2"
            />
            <DashboardCard
              label="Retain"
              value={`${data.job?.retain_days ?? retainDays} days`}
              hint="Older archives pruned after success"
            />
          </section>

          <section className="page-section">
            <h3>Schedule & scope</h3>
            <p className="hint" style={{ marginTop: 4 }}>
              Archives are gzip JSON uploaded to R2 under <code>backups/…</code>. Env{' '}
              <code>BACKUP_ENGINE_*</code> controls the process cron; the job row stores UI toggles.
            </p>
            <form className="form-grid" onSubmit={(e) => void onSaveSchedule(e)} style={{ marginTop: 12 }}>
              <label className="checkbox-row span-2">
                <input
                  type="checkbox"
                  checked={enabled}
                  disabled={!canWrite || busy}
                  onChange={(e) => setEnabled(e.target.checked)}
                />
                Job enabled (also requires BACKUP_ENGINE_ENABLED on API)
              </label>
              <label>
                Cron
                <input
                  value={cron}
                  disabled={!canWrite || busy}
                  onChange={(e) => setCron(e.target.value)}
                  placeholder="0 2 * * *"
                />
              </label>
              <label>
                Timezone
                <input
                  value={timezone}
                  disabled={!canWrite || busy}
                  onChange={(e) => setTimezone(e.target.value)}
                />
              </label>
              <label>
                Retain days
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={retainDays}
                  disabled={!canWrite || busy}
                  onChange={(e) => setRetainDays(Number(e.target.value) || 30)}
                />
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={includeSettings}
                  disabled={!canWrite || busy}
                  onChange={(e) => setIncludeSettings(e.target.checked)}
                />
                Settings backup
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={includeDb}
                  disabled={!canWrite || busy}
                  onChange={(e) => setIncludeDb(e.target.checked)}
                />
                Database backup (JSON tables)
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={includeR2}
                  disabled={!canWrite || busy}
                  onChange={(e) => setIncludeR2(e.target.checked)}
                />
                R2 metadata backup
              </label>
              {canWrite ? (
                <div className="span-2 form-actions">
                  <button type="submit" className="btn primary" disabled={busy}>
                    Save schedule
                  </button>
                </div>
              ) : null}
            </form>
          </section>

          <section className="page-section">
            <h3>Backup history</h3>
            {!data.recent_runs.length ? (
              <p className="hint">No runs yet. Apply the backup migration, then run a manual backup.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Trigger</th>
                      <th>Status</th>
                      <th>Size</th>
                      <th>Tables</th>
                      <th>R2 keys</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_runs.map((run) => (
                      <tr key={run.id}>
                        <td>{new Date(run.started_at).toLocaleString('en-IN')}</td>
                        <td>{run.trigger}</td>
                        <td>
                          <span className={`dash-card dash-card-${statusTone(run.status)}`} style={{ padding: '2px 8px', display: 'inline-block' }}>
                            {run.status}
                          </span>
                          {run.error_message ? (
                            <div className="hint" title={run.error_message}>
                              {run.error_message.slice(0, 80)}
                            </div>
                          ) : null}
                        </td>
                        <td>{formatBytes(run.byte_size)}</td>
                        <td>{run.tables_exported.length}</td>
                        <td>{run.r2_keys_count}</td>
                        <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {run.download_url ? (
                            <a className="btn ghost" href={run.download_url} target="_blank" rel="noreferrer">
                              Download
                            </a>
                          ) : null}
                          {canWrite && run.status === 'succeeded' ? (
                            <>
                              <button
                                type="button"
                                className="btn ghost"
                                disabled={busy}
                                onClick={() => void onRestore(run, 'settings')}
                              >
                                Restore settings
                              </button>
                              <button
                                type="button"
                                className="btn ghost"
                                disabled={busy}
                                onClick={() => void onRestore(run, 'settings_and_r2_metadata')}
                              >
                                Restore + R2 meta
                              </button>
                            </>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
