/**
 * Admin Notification Dashboard — stats, searchable campaigns, CSV export.
 *
 * Metrics:
 *   Total      = campaign rows
 *   Delivered  = sum push_success_count (device sends accepted)
 *   Failed     = sum push_failure_count
 *   Opened     = inbox rows with read_at (mark-read / tap-to-open)
 *   Click Rate = opened / delivered * 100
 */
import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import { sanitizeSearchTerm } from '../utils/postgrestSafe';
import type {
  NotificationAdminCampaignRow,
  NotificationAdminCsvExport,
  NotificationAdminListPage,
  NotificationAdminStats,
  NotificationAudienceType,
  NotificationCampaignStatus,
  NotificationType,
} from '@sharanam/shared';

export type NotificationAdminFilters = {
  search?: string;
  status?: 'all' | NotificationCampaignStatus;
  type?: 'all' | NotificationType;
  page?: number;
  pageSize?: number;
};

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function clickRate(opened: number, delivered: number): number {
  if (delivered <= 0) return 0;
  return Math.round((opened / delivered) * 1000) / 10;
}

async function countOpenedByNotificationIds(
  notificationIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (!notificationIds.length) return map;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('notification_inbox')
    .select('notification_id')
    .in('notification_id', notificationIds)
    .not('read_at', 'is', null);

  if (error) {
    throw new AppError(500, 'NOTIFICATION_OPENED_COUNT_FAILED', error.message);
  }

  for (const row of data ?? []) {
    const id = row.notification_id as string;
    map.set(id, (map.get(id) ?? 0) + 1);
  }
  return map;
}

export async function getNotificationAdminStats(): Promise<NotificationAdminStats> {
  const supabase = getSupabaseAdmin();

  const [campaigns, openedResult] = await Promise.all([
    supabase
      .from('notifications')
      .select('id, push_success_count, push_failure_count'),
    supabase
      .from('notification_inbox')
      .select('id', { count: 'exact', head: true })
      .not('read_at', 'is', null),
  ]);

  if (campaigns.error) {
    throw new AppError(500, 'NOTIFICATION_STATS_FAILED', campaigns.error.message);
  }
  if (openedResult.error) {
    throw new AppError(500, 'NOTIFICATION_STATS_FAILED', openedResult.error.message);
  }

  const rows = campaigns.data ?? [];
  let delivered = 0;
  let failed = 0;
  for (const row of rows) {
    delivered += Number(row.push_success_count) || 0;
    failed += Number(row.push_failure_count) || 0;
  }
  const opened = openedResult.count ?? 0;

  return {
    total_notifications: rows.length,
    delivered,
    opened,
    failed,
    click_rate_percent: clickRate(opened, delivered),
  };
}

export async function listNotificationAdminCampaigns(
  filters: NotificationAdminFilters = {},
): Promise<NotificationAdminListPage> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(Math.max(filters.pageSize ?? 20, 1), 100);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const search = sanitizeSearchTerm(filters.search?.trim() ?? '');

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('notifications')
    .select(
      'id, title, body, notification_type, audience_type, status, target_user_count, push_success_count, push_failure_count, sent_at, created_at',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false });

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters.type && filters.type !== 'all') {
    query = query.eq('notification_type', filters.type);
  }
  if (search) {
    query = query.or(`title.ilike.%${search}%,body.ilike.%${search}%`);
  }

  const { data, error, count } = await query.range(from, to);
  if (error) {
    throw new AppError(500, 'NOTIFICATION_LIST_FAILED', error.message);
  }

  const rows = data ?? [];
  const ids = rows.map((r) => r.id as string);
  const openedMap = await countOpenedByNotificationIds(ids);

  const items: NotificationAdminCampaignRow[] = rows.map((row) => {
    const delivered = Number(row.push_success_count) || 0;
    const failed = Number(row.push_failure_count) || 0;
    const opened = openedMap.get(row.id as string) ?? 0;
    return {
      id: row.id as string,
      title: row.title as string,
      body: (row.body as string) ?? '',
      notification_type: row.notification_type as NotificationType,
      audience_type: row.audience_type as NotificationAudienceType,
      status: row.status as NotificationCampaignStatus,
      target_user_count: Number(row.target_user_count) || 0,
      delivered,
      failed,
      opened,
      click_rate_percent: clickRate(opened, delivered),
      sent_at: (row.sent_at as string | null) ?? null,
      created_at: row.created_at as string,
    };
  });

  const total = count ?? 0;
  return {
    items,
    page,
    pageSize,
    total,
    hasMore: from + items.length < total,
  };
}

export async function exportNotificationAdminCsv(
  filters: Omit<NotificationAdminFilters, 'page' | 'pageSize'> = {},
): Promise<NotificationAdminCsvExport> {
  const page = await listNotificationAdminCampaigns({
    ...filters,
    page: 1,
    pageSize: 500,
  });

  const header = [
    'id',
    'title',
    'type',
    'audience',
    'status',
    'targets',
    'delivered',
    'opened',
    'failed',
    'click_rate_percent',
    'sent_at',
    'created_at',
  ];

  const lines = [
    header.join(','),
    ...page.items.map((row) =>
      [
        row.id,
        row.title,
        row.notification_type,
        row.audience_type,
        row.status,
        row.target_user_count,
        row.delivered,
        row.opened,
        row.failed,
        row.click_rate_percent,
        row.sent_at ?? '',
        row.created_at,
      ]
        .map((cell) => csvEscape(String(cell)))
        .join(','),
    ),
  ];

  const stamp = new Date().toISOString().slice(0, 10);
  return {
    filename: `notifications-${stamp}.csv`,
    csv: lines.join('\n'),
  };
}
