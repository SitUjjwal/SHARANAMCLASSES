/**
 * Reminder Engine admin — config status + manual tick.
 */
import { useCallback, useEffect, useState } from 'react';

import { PageHeader } from '@/components/PageHeader';
import {
  fetchReminderEngineStatus,
  runReminderEngineTick,
  type ReminderEngineStatus,
  type ReminderTickResult,
} from '@/features/reminders/api';
import { ApiClientError } from '@/services/api';

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function ReminderEnginePage() {
  const [status, setStatus] = useState<ReminderEngineStatus | null>(null);
  const [lastTick, setLastTick] = useState<ReminderTickResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStatus(await fetchReminderEngineStatus());
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else if (err instanceof TypeError) {
        setError('Cannot reach API. Start apps/api (port 4000).');
      } else {
        setError('Failed to load Reminder Engine status');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onTick(dryRun: boolean) {
    setRunning(true);
    setError(null);
    try {
      const result = await runReminderEngineTick(dryRun);
      setLastTick(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Tick failed');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Reminder Engine"
        description="Scheduled jobs for live classes, tomorrow’s tests, course expiry, new chapters, and missed classes."
      />

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="hint">Loading…</p> : null}

      {status ? (
        <div className="payment-stats" role="group" aria-label="Reminder Engine config">
          <div className="payment-stat">
            <span className="payment-stat-label">Enabled</span>
            <strong className="payment-stat-value">
              {status.enabled ? 'Yes' : 'No'}
            </strong>
          </div>
          <div className="payment-stat">
            <span className="payment-stat-label">Cron</span>
            <strong className="payment-stat-value">{status.cron}</strong>
          </div>
          <div className="payment-stat">
            <span className="payment-stat-label">Timezone</span>
            <strong className="payment-stat-value">{status.timezone}</strong>
          </div>
          <div className="payment-stat">
            <span className="payment-stat-label">Live lead</span>
            <strong className="payment-stat-value">
              {status.liveLeadMinutes} min
            </strong>
          </div>
          <div className="payment-stat">
            <span className="payment-stat-label">Expiry days</span>
            <strong className="payment-stat-value">
              {status.expiryDays.join(', ')}
            </strong>
          </div>
        </div>
      ) : null}

      <div className="toolbar-row" style={{ display: 'flex', gap: '0.75rem', margin: '1rem 0' }}>
        <button
          type="button"
          className="btn ghost"
          disabled={running}
          onClick={() => void onTick(true)}
        >
          {running ? 'Running…' : 'Dry-run tick'}
        </button>
        <button
          type="button"
          className="btn primary"
          disabled={running}
          onClick={() => void onTick(false)}
        >
          {running ? 'Running…' : 'Run tick now'}
        </button>
        <button type="button" className="btn ghost" disabled={loading} onClick={() => void load()}>
          Refresh status
        </button>
      </div>

      <p className="hint">
        Dry-run scans without claiming or sending. Run tick claims via{' '}
        <code>reminder_dispatches</code> and sends through the Notification Service.
      </p>

      {lastTick ? (
        <div className="card-panel" style={{ marginTop: '1rem' }}>
          <h2 className="section-title">
            Last tick {lastTick.dry_run ? '(dry-run)' : ''}
          </h2>
          <p className="hint">
            {formatWhen(lastTick.started_at)} → {formatWhen(lastTick.finished_at)}
            {lastTick.skipped_overlap ? ' · skipped (overlap)' : ''}
          </p>
          {lastTick.handlers.length === 0 ? (
            <p className="hint">No handler results.</p>
          ) : (
            <div className="banner-admin-list">
              {lastTick.handlers.map((h) => (
                <article key={h.reminder_type} className="banner-admin-card">
                  <div className="banner-admin-meta">
                    <strong>{h.reminder_type}</strong>
                    <span className="hint">
                      scanned {h.scanned} · claimed {h.claimed} · sent {h.sent} ·
                      skipped {h.skipped}
                    </span>
                    {h.errors.length ? (
                      <span className="form-error">{h.errors.join(' · ')}</span>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
