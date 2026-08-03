/**
 * Module 10 admin ops — revenue, reports, activity logs.
 * Platform settings live in systemSettings.service (re-exported for compatibility).
 */
import type {
  AdminActivityLogPage,
  AdminChartPoint,
  AdminCsvExport,
  AdminReportSummary,
  AdminRevenueOverview,
  PlatformGeneralSettings,
  PlatformSettingsBundle,
} from '@sharanam/shared';

import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import {
  exportActivityLogsCsv as exportActivityLogsCsvImpl,
  listActivityLogs,
  writeActivityLog,
} from './activityLog.service';
import { getAdminPaymentStats, kolkataDayBounds } from './paymentAdmin.service';
import { listReportCatalog } from './reportExport.service';
import {
  getPlatformSettings as getPlatformSettingsImpl,
  updatePlatformSettings as updatePlatformSettingsImpl,
} from './systemSettings.service';

const TZ = 'Asia/Kolkata';

function formatInrFromPaise(amountPaise: number): string {
  return `₹${Math.round(amountPaise / 100).toLocaleString('en-IN')}`;
}

async function sumAllPaidPaise(): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('payment_orders')
    .select('amount_paise')
    .eq('status', 'paid');
  if (error) {
    throw new AppError(500, 'REVENUE_TOTAL_FAILED', error.message);
  }
  return (data ?? []).reduce((acc, row) => acc + Number(row.amount_paise ?? 0), 0);
}

async function buildRevenueSeries(days = 14): Promise<AdminChartPoint[]> {
  const supabase = getSupabaseAdmin();
  const points: AdminChartPoint[] = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const now = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const { start, end } = kolkataDayBounds(now);
    const { data, error } = await supabase
      .from('payment_orders')
      .select('amount_paise')
      .eq('status', 'paid')
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString());

    if (error) {
      throw new AppError(500, 'REVENUE_SERIES_FAILED', error.message);
    }

    const sum = (data ?? []).reduce(
      (acc, row) => acc + Number(row.amount_paise ?? 0),
      0,
    );
    points.push({
      label: start.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        timeZone: TZ,
      }),
      value: Math.round(sum / 100),
    });
  }

  return points;
}

/** GET /admin/revenue/overview */
export async function getAdminRevenueOverview(): Promise<AdminRevenueOverview> {
  const [stats, total_paid_paise, revenue_series] = await Promise.all([
    getAdminPaymentStats(),
    sumAllPaidPaise(),
    buildRevenueSeries(14),
  ]);

  return {
    today_revenue_paise: stats.today_revenue_paise,
    today_revenue_display: stats.today_revenue_display,
    monthly_revenue_paise: stats.monthly_revenue_paise,
    monthly_revenue_display: stats.monthly_revenue_display,
    total_paid_paise,
    total_paid_display: formatInrFromPaise(total_paid_paise),
    paid_orders: stats.paid_orders,
    failed_payments: stats.failed_payments,
    pending_payments: stats.pending_payments,
    revenue_series,
    timezone: stats.timezone,
  };
}

/** GET /admin/reports */
export function listAdminReports(): AdminReportSummary[] {
  return listReportCatalog();
}

export type ListActivityLogsQuery = {
  page: number;
  pageSize: number;
  action?: string;
  category?: 'auth' | 'payment' | 'profile' | 'course' | 'admin' | 'all';
  search?: string;
};

/** GET /admin/activity-logs */
export async function listAdminActivityLogs(
  query: ListActivityLogsQuery,
): Promise<AdminActivityLogPage> {
  return listActivityLogs(query);
}

/** Append an activity log row (best-effort). */
export async function writeAdminActivityLog(input: {
  actor_id?: string | null;
  actor_email?: string | null;
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await writeActivityLog(input);
}

/** GET /admin/activity-logs/export */
export async function exportActivityLogsCsv(
  query: Omit<ListActivityLogsQuery, 'page' | 'pageSize'> = {},
): Promise<AdminCsvExport> {
  return exportActivityLogsCsvImpl(query);
}

/** @deprecated Prefer systemSettings.service */
export async function getPlatformSettings(): Promise<PlatformSettingsBundle> {
  return getPlatformSettingsImpl();
}

/** @deprecated Prefer systemSettings.service */
export async function updatePlatformSettings(input: {
  general: PlatformGeneralSettings;
  actor_id: string;
  actor_email: string | null;
}): Promise<PlatformSettingsBundle> {
  return updatePlatformSettingsImpl(input);
}
