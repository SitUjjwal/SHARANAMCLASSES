/**
 * Periodic process + database latency probes for Monitoring.
 */
import { getSupabaseAdmin } from '../config/supabase';
import { env } from '../config/env';
import { logger } from '../logging/logger';
import { alertStore } from './alertStore';
import { metricsStore } from './metricsStore';

let samplerTimer: ReturnType<typeof setInterval> | null = null;
let snapshotTimer: ReturnType<typeof setInterval> | null = null;

async function probeDatabase(): Promise<void> {
  const started = Date.now();
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('app_meta').select('key').limit(1);
    const durationMs = Date.now() - started;
    if (error) {
      metricsStore.recordDbQuery(durationMs, false, error.message);
    } else {
      metricsStore.recordDbQuery(durationMs, true);
    }
  } catch (err) {
    metricsStore.recordDbQuery(
      Date.now() - started,
      false,
      err instanceof Error ? err.message : String(err),
    );
  } finally {
    alertStore.evaluate(metricsStore.getOverview());
  }
}

async function persistSnapshot(): Promise<void> {
  if (env.NODE_ENV === 'test') return;
  try {
    const payload = metricsStore.getOverview();
    payload.alerts = alertStore.list(20);
    payload.active_alert_count = alertStore.activeCount();
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('system_metrics_snapshots').insert({
      payload,
      captured_at: new Date().toISOString(),
    });
    if (error) {
      logger.warn('metrics snapshot persist failed', { message: error.message }, 'system');
    }
  } catch (err) {
    logger.warn(
      'metrics snapshot persist error',
      { message: err instanceof Error ? err.message : String(err) },
      'system',
    );
  }
}

export function startMonitoringSampler(): void {
  if (samplerTimer) return;

  metricsStore.sampleProcess();
  void probeDatabase();

  samplerTimer = setInterval(() => {
    metricsStore.sampleProcess();
    void probeDatabase();
  }, 15_000);
  if (typeof samplerTimer.unref === 'function') samplerTimer.unref();

  snapshotTimer = setInterval(() => {
    void persistSnapshot();
  }, 5 * 60_000);
  if (typeof snapshotTimer.unref === 'function') snapshotTimer.unref();

  logger.info('Monitoring sampler started', {}, 'system');
}

export function stopMonitoringSampler(): void {
  if (samplerTimer) {
    clearInterval(samplerTimer);
    samplerTimer = null;
  }
  if (snapshotTimer) {
    clearInterval(snapshotTimer);
    snapshotTimer = null;
  }
}
