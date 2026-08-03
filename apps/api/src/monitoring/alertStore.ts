/**
 * In-process ops alerts — raised from metrics thresholds.
 * Logged + exposed via MonitoringOverview / GET /alerts.
 */
import { logger } from '../logging/logger';
import type { MonitoringOverview } from '@sharanam/shared';
import type { SystemAlert, SystemAlertSeverity } from '@sharanam/shared';

const MAX_ALERTS = 100;
const COOLDOWN_MS = 5 * 60_000;

type Rule = {
  code: string;
  severity: SystemAlertSeverity;
  message: (overview: MonitoringOverview) => string;
  active: (overview: MonitoringOverview) => boolean;
};

const RULES: Rule[] = [
  {
    code: 'db.unreachable',
    severity: 'critical',
    message: (o) => o.database.last_error ?? 'Database probe failed',
    active: (o) => Boolean(o.database.last_error),
  },
  {
    code: 'api.latency.high',
    severity: 'warning',
    message: (o) => `API p95 latency ${o.api.latency.p95_ms} ms (threshold 2000 ms)`,
    active: (o) => o.api.latency.count >= 5 && o.api.latency.p95_ms >= 2000,
  },
  {
    code: 'api.success_rate.low',
    severity: 'warning',
    message: (o) => `API success rate ${o.api.success_rate_percent}% (threshold 90%)`,
    active: (o) => o.api.requests >= 20 && o.api.success_rate_percent < 90,
  },
  {
    code: 'payments.failures',
    severity: 'critical',
    message: (o) => `${o.failures.failed_payments} failed payment(s) in window`,
    active: (o) => o.failures.failed_payments >= 3,
  },
  {
    code: 'notifications.failures',
    severity: 'warning',
    message: (o) => `${o.failures.notification_failures} notification failure(s) in window`,
    active: (o) => o.failures.notification_failures >= 10,
  },
  {
    code: 'memory.high',
    severity: 'warning',
    message: (o) => `RSS ${o.process.memory.rss_mb} MB (threshold 1024 MB)`,
    active: (o) => o.process.memory.rss_mb >= 1024,
  },
];

class AlertStore {
  private alerts: SystemAlert[] = [];
  private lastFired = new Map<string, number>();
  private seq = 0;

  evaluate(overview: MonitoringOverview): void {
    const now = Date.now();
    for (const rule of RULES) {
      if (!rule.active(overview)) continue;
      const last = this.lastFired.get(rule.code) ?? 0;
      if (now - last < COOLDOWN_MS) continue;
      this.lastFired.set(rule.code, now);
      this.push({
        id: `alt_${++this.seq}_${now}`,
        code: rule.code,
        severity: rule.severity,
        message: rule.message(overview),
        created_at: new Date(now).toISOString(),
        acknowledged: false,
      });
    }
  }

  private push(alert: SystemAlert): void {
    this.alerts.unshift(alert);
    if (this.alerts.length > MAX_ALERTS) {
      this.alerts.length = MAX_ALERTS;
    }
    const level = alert.severity === 'critical' ? 'error' : 'warn';
    logger[level](
      `Alert: ${alert.code}`,
      { alert_id: alert.id, severity: alert.severity, message: alert.message },
      'system',
    );
  }

  list(limit = 50): SystemAlert[] {
    return this.alerts.slice(0, Math.max(1, Math.min(limit, MAX_ALERTS)));
  }

  activeCount(): number {
    return this.alerts.filter((a) => !a.acknowledged).length;
  }

  acknowledge(id: string): SystemAlert | null {
    const found = this.alerts.find((a) => a.id === id);
    if (!found) return null;
    found.acknowledged = true;
    return found;
  }
}

export const alertStore = new AlertStore();
