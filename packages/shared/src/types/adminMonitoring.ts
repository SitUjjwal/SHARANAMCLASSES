/**
 * Module 11 — Admin Monitoring overview types.
 */
export type MonitoringLatencyStats = {
  count: number;
  avg_ms: number;
  p50_ms: number;
  p95_ms: number;
  p99_ms: number;
  max_ms: number;
};

export type MonitoringSeriesPoint = {
  /** ISO timestamp (bucket start) */
  t: string;
  value: number;
};

export type SystemAlertSeverity = 'info' | 'warning' | 'critical';

export type SystemAlert = {
  id: string;
  code: string;
  severity: SystemAlertSeverity;
  message: string;
  created_at: string;
  acknowledged: boolean;
};

export type MonitoringOverview = {
  generated_at: string;
  window_minutes: number;
  uptime_seconds: number;
  process: {
    pid: number;
    node_version: string;
    memory: {
      rss_mb: number;
      heap_used_mb: number;
      heap_total_mb: number;
      external_mb: number;
    };
    cpu: {
      /** Process CPU % over last sample interval (approx) */
      process_percent: number;
      /** 1-minute load average (Unix); 0 on Windows when unavailable */
      load_avg_1m: number;
    };
  };
  api: {
    requests: number;
    failed_requests: number;
    success_rate_percent: number;
    latency: MonitoringLatencyStats;
    /** Requests per minute over the window */
    rpm_series: MonitoringSeriesPoint[];
    /** Avg latency (ms) per minute */
    latency_series: MonitoringSeriesPoint[];
  };
  database: {
    samples: number;
    latency: MonitoringLatencyStats;
    /** Last successful probe ISO time */
    last_ok_at: string | null;
    /** Last error message if probe failed */
    last_error: string | null;
    latency_series: MonitoringSeriesPoint[];
  };
  failures: {
    failed_requests: number;
    failed_payments: number;
    notification_failures: number;
    /** Failure counts per minute */
    failed_requests_series: MonitoringSeriesPoint[];
    failed_payments_series: MonitoringSeriesPoint[];
    notification_failures_series: MonitoringSeriesPoint[];
  };
  top_slow_routes: Array<{
    method_path: string;
    count: number;
    avg_ms: number;
    p95_ms: number;
  }>;
  /** Recent threshold alerts (newest first) */
  alerts: SystemAlert[];
  active_alert_count: number;
};
