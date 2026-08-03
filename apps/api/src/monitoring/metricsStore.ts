/**
 * In-memory metrics store — rolling window for Module 11 Monitoring.
 * Single-process; multi-instance deployments each report their own process metrics.
 */
import type {
  MonitoringLatencyStats,
  MonitoringOverview,
  MonitoringSeriesPoint,
} from '@sharanam/shared';
import os from 'node:os';

const WINDOW_MS = 60 * 60_000; // 60 minutes
const MAX_LATENCY_SAMPLES = 8_000;
const MAX_EVENT_SAMPLES = 4_000;
const MAX_ROUTE_KEYS = 80;

type TimedSample = { at: number; ms: number };
type CountEvent = { at: number; count?: number };
type RouteAgg = { samples: number[]; lastAt: number };

function now() {
  return Date.now();
}

function pushCapped<T>(arr: T[], item: T, max: number) {
  arr.push(item);
  if (arr.length > max) {
    arr.splice(0, arr.length - max);
  }
}

function pruneTimed(arr: TimedSample[], cutoff: number) {
  while (arr.length && arr[0]!.at < cutoff) arr.shift();
}

function pruneEvents(arr: CountEvent[], cutoff: number) {
  while (arr.length && arr[0]!.at < cutoff) arr.shift();
}

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx] ?? 0;
}

function latencyStats(samples: TimedSample[], cutoff: number): MonitoringLatencyStats {
  const values = samples.filter((s) => s.at >= cutoff).map((s) => s.ms);
  if (!values.length) {
    return { count: 0, avg_ms: 0, p50_ms: 0, p95_ms: 0, p99_ms: 0, max_ms: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    count: sorted.length,
    avg_ms: Math.round((sum / sorted.length) * 10) / 10,
    p50_ms: Math.round(percentile(sorted, 50) * 10) / 10,
    p95_ms: Math.round(percentile(sorted, 95) * 10) / 10,
    p99_ms: Math.round(percentile(sorted, 99) * 10) / 10,
    max_ms: Math.round((sorted[sorted.length - 1] ?? 0) * 10) / 10,
  };
}

function minuteBucket(ts: number): number {
  return Math.floor(ts / 60_000) * 60_000;
}

function seriesFromTimed(
  samples: TimedSample[],
  cutoff: number,
  mode: 'avg' | 'count',
): MonitoringSeriesPoint[] {
  const buckets = new Map<number, { sum: number; n: number }>();
  for (const s of samples) {
    if (s.at < cutoff) continue;
    const b = minuteBucket(s.at);
    const cur = buckets.get(b) ?? { sum: 0, n: 0 };
    cur.sum += s.ms;
    cur.n += 1;
    buckets.set(b, cur);
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([t, v]) => ({
      t: new Date(t).toISOString(),
      value:
        mode === 'count'
          ? v.n
          : Math.round((v.sum / Math.max(1, v.n)) * 10) / 10,
    }));
}

function seriesFromEvents(events: CountEvent[], cutoff: number): MonitoringSeriesPoint[] {
  const buckets = new Map<number, number>();
  for (const e of events) {
    if (e.at < cutoff) continue;
    const b = minuteBucket(e.at);
    buckets.set(b, (buckets.get(b) ?? 0) + (e.count ?? 1));
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([t, value]) => ({ t: new Date(t).toISOString(), value }));
}

function mb(bytes: number): number {
  return Math.round((bytes / (1024 * 1024)) * 10) / 10;
}

class MetricsStore {
  private readonly startedAt = now();
  private apiLatency: TimedSample[] = [];
  private dbLatency: TimedSample[] = [];
  private failedRequests: CountEvent[] = [];
  private failedPayments: CountEvent[] = [];
  private notificationFailures: CountEvent[] = [];
  private routes = new Map<string, RouteAgg>();
  private lastDbOkAt: string | null = null;
  private lastDbError: string | null = null;
  private lastCpuUsage = process.cpuUsage();
  private lastCpuAt = now();
  private processCpuPercent = 0;
  private memory = process.memoryUsage();

  recordApiRequest(input: {
    method: string;
    path: string;
    status: number;
    durationMs: number;
  }) {
    const at = now();
    const cutoff = at - WINDOW_MS;
    pushCapped(this.apiLatency, { at, ms: Math.max(0, input.durationMs) }, MAX_LATENCY_SAMPLES);
    pruneTimed(this.apiLatency, cutoff);

    if (input.status >= 400) {
      pushCapped(this.failedRequests, { at }, MAX_EVENT_SAMPLES);
      pruneEvents(this.failedRequests, cutoff);
    }

    const key = `${input.method} ${normalizePath(input.path)}`;
    let agg = this.routes.get(key);
    if (!agg) {
      if (this.routes.size >= MAX_ROUTE_KEYS) {
        // Drop oldest route key
        let oldestKey: string | null = null;
        let oldestAt = Infinity;
        for (const [k, v] of this.routes) {
          if (v.lastAt < oldestAt) {
            oldestAt = v.lastAt;
            oldestKey = k;
          }
        }
        if (oldestKey) this.routes.delete(oldestKey);
      }
      agg = { samples: [], lastAt: at };
      this.routes.set(key, agg);
    }
    agg.samples.push(input.durationMs);
    if (agg.samples.length > 200) agg.samples.splice(0, agg.samples.length - 200);
    agg.lastAt = at;
  }

  recordDbQuery(durationMs: number, ok: boolean, errorMessage?: string) {
    const at = now();
    pushCapped(this.dbLatency, { at, ms: Math.max(0, durationMs) }, MAX_LATENCY_SAMPLES);
    pruneTimed(this.dbLatency, at - WINDOW_MS);
    if (ok) {
      this.lastDbOkAt = new Date(at).toISOString();
      this.lastDbError = null;
    } else {
      this.lastDbError = (errorMessage ?? 'DB probe failed').slice(0, 240);
    }
  }

  recordFailedPayment() {
    const at = now();
    pushCapped(this.failedPayments, { at }, MAX_EVENT_SAMPLES);
    pruneEvents(this.failedPayments, at - WINDOW_MS);
  }

  recordNotificationFailures(count: number) {
    if (count <= 0) return;
    const at = now();
    pushCapped(this.notificationFailures, { at, count }, MAX_EVENT_SAMPLES);
    pruneEvents(this.notificationFailures, at - WINDOW_MS);
  }

  sampleProcess() {
    this.memory = process.memoryUsage();
    const usage = process.cpuUsage(this.lastCpuUsage);
    const elapsedMs = Math.max(1, now() - this.lastCpuAt);
    const cpuMs = (usage.user + usage.system) / 1000;
    // Approximate % of a single core
    this.processCpuPercent = Math.min(100, Math.round((cpuMs / elapsedMs) * 1000) / 10);
    this.lastCpuUsage = process.cpuUsage();
    this.lastCpuAt = now();
  }

  getOverview(): MonitoringOverview {
    const at = now();
    const cutoff = at - WINDOW_MS;
    pruneTimed(this.apiLatency, cutoff);
    pruneTimed(this.dbLatency, cutoff);
    pruneEvents(this.failedRequests, cutoff);
    pruneEvents(this.failedPayments, cutoff);
    pruneEvents(this.notificationFailures, cutoff);

    const apiLatency = latencyStats(this.apiLatency, cutoff);
    const dbLatency = latencyStats(this.dbLatency, cutoff);
    const failedReqCount = this.failedRequests.reduce((n, e) => n + (e.count ?? 1), 0);
    const failedPayCount = this.failedPayments.reduce((n, e) => n + (e.count ?? 1), 0);
    const notifFailCount = this.notificationFailures.reduce((n, e) => n + (e.count ?? 1), 0);
    const successRate =
      apiLatency.count === 0
        ? 100
        : Math.round(((apiLatency.count - failedReqCount) / apiLatency.count) * 1000) / 10;

    const load = os.loadavg?.() ?? [0, 0, 0];

    const topSlow = [...this.routes.entries()]
      .map(([method_path, agg]) => {
        const sorted = [...agg.samples].sort((a, b) => a - b);
        const sum = sorted.reduce((a, b) => a + b, 0);
        return {
          method_path,
          count: sorted.length,
          avg_ms: sorted.length ? Math.round((sum / sorted.length) * 10) / 10 : 0,
          p95_ms: Math.round(percentile(sorted, 95) * 10) / 10,
        };
      })
      .filter((r) => r.count >= 3)
      .sort((a, b) => b.p95_ms - a.p95_ms)
      .slice(0, 8);

    return {
      generated_at: new Date(at).toISOString(),
      window_minutes: WINDOW_MS / 60_000,
      uptime_seconds: Math.floor((at - this.startedAt) / 1000),
      process: {
        pid: process.pid,
        node_version: process.version,
        memory: {
          rss_mb: mb(this.memory.rss),
          heap_used_mb: mb(this.memory.heapUsed),
          heap_total_mb: mb(this.memory.heapTotal),
          external_mb: mb(this.memory.external),
        },
        cpu: {
          process_percent: this.processCpuPercent,
          load_avg_1m: Math.round((load[0] ?? 0) * 100) / 100,
        },
      },
      api: {
        requests: apiLatency.count,
        failed_requests: failedReqCount,
        success_rate_percent: Math.max(0, successRate),
        latency: apiLatency,
        rpm_series: seriesFromTimed(this.apiLatency, cutoff, 'count'),
        latency_series: seriesFromTimed(this.apiLatency, cutoff, 'avg'),
      },
      database: {
        samples: dbLatency.count,
        latency: dbLatency,
        last_ok_at: this.lastDbOkAt,
        last_error: this.lastDbError,
        latency_series: seriesFromTimed(this.dbLatency, cutoff, 'avg'),
      },
      failures: {
        failed_requests: failedReqCount,
        failed_payments: failedPayCount,
        notification_failures: notifFailCount,
        failed_requests_series: seriesFromEvents(this.failedRequests, cutoff),
        failed_payments_series: seriesFromEvents(this.failedPayments, cutoff),
        notification_failures_series: seriesFromEvents(this.notificationFailures, cutoff),
      },
      top_slow_routes: topSlow,
      alerts: [],
      active_alert_count: 0,
    };
  }
}

function normalizePath(path: string): string {
  return path
    .split('?')[0]!
    .replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi,
      ':id',
    )
    .replace(/\/\d+/g, '/:id');
}

export const metricsStore = new MetricsStore();
