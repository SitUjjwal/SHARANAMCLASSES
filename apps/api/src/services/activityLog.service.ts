/**
 * Activity Log — audit trail for auth, payments, profile, purchases, admin actions.
 *
 * Security:
 * - Table RLS deny-all; only service-role (API) can write/read
 * - Clients cannot query logs directly from Supabase
 * - POST /activity/events allows only self auth.login / auth.logout
 * - Admin list/export requires requireAdmin
 * - Metadata should avoid secrets (passwords, full card data); prefer field keys
 */
import type { AdminActivityLog, AdminActivityLogPage, AdminCsvExport } from '@sharanam/shared';

import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';

export type ActivityCategory =
  | 'auth'
  | 'payment'
  | 'profile'
  | 'course'
  | 'admin'
  | 'all';

export type WriteActivityLogInput = {
  actor_id?: string | null;
  actor_email?: string | null;
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
};

export const ACTIVITY_ACTION_CATALOG = [
  { value: 'auth.login', label: 'Login', category: 'auth' },
  { value: 'auth.logout', label: 'Logout', category: 'auth' },
  { value: 'payment.completed', label: 'Payment', category: 'payment' },
  { value: 'profile.update', label: 'Profile Update', category: 'profile' },
  { value: 'course.purchase', label: 'Course Purchase', category: 'course' },
  { value: 'course.enroll', label: 'Course Enroll (free)', category: 'course' },
  { value: 'settings.update', label: 'Admin · Settings', category: 'admin' },
  { value: 'student.update', label: 'Admin · Student update', category: 'admin' },
  { value: 'student.suspend', label: 'Admin · Suspend student', category: 'admin' },
  { value: 'student.activate', label: 'Admin · Activate student', category: 'admin' },
  { value: 'student.reset_password', label: 'Admin · Reset password', category: 'admin' },
  { value: 'teacher.create', label: 'Admin · Add teacher', category: 'admin' },
  { value: 'teacher.update', label: 'Admin · Edit teacher', category: 'admin' },
  { value: 'teacher.remove', label: 'Admin · Delete teacher', category: 'admin' },
  { value: 'teacher.assign_courses', label: 'Admin · Assign courses', category: 'admin' },
  {
    value: 'teacher.assign_live_classes',
    label: 'Admin · Assign live classes',
    category: 'admin',
  },
] as const;

export type ListActivityLogsQuery = {
  page: number;
  pageSize: number;
  action?: string;
  category?: ActivityCategory;
  search?: string;
};

/** Best-effort append — never throws to callers. */
export async function writeActivityLog(input: WriteActivityLogInput): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('admin_activity_logs').insert({
      actor_id: input.actor_id ?? null,
      actor_email: input.actor_email ?? null,
      action: input.action,
      entity_type: input.entity_type ?? null,
      entity_id: input.entity_id ?? null,
      summary: input.summary.slice(0, 500),
      metadata: sanitizeMetadata(input.metadata ?? {}),
    });
    if (error && !error.message.toLowerCase().includes('does not exist')) {
      console.warn('[activity-log] write failed:', error.message);
    }
  } catch (err) {
    console.warn('[activity-log] write exception:', err);
  }
}

/** @deprecated alias — prefer writeActivityLog */
export const writeAdminActivityLog = writeActivityLog;

function sanitizeMetadata(meta: Record<string, unknown>): Record<string, unknown> {
  const blocked = new Set([
    'password',
    'new_password',
    'current_password',
    'temporary_password',
    'token',
    'access_token',
    'refresh_token',
    'razorpay_signature',
  ]);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (blocked.has(k.toLowerCase())) continue;
    if (typeof v === 'string' && v.length > 200) {
      out[k] = `${v.slice(0, 200)}…`;
    } else {
      out[k] = v;
    }
  }
  return out;
}

function applyCategoryFilter(query: any, category?: ActivityCategory): any {
  if (!category || category === 'all') return query;
  if (category === 'auth') return query.like('action', 'auth.%');
  if (category === 'payment') return query.like('action', 'payment.%');
  if (category === 'profile') return query.like('action', 'profile.%');
  if (category === 'course') return query.like('action', 'course.%');
  if (category === 'admin') {
    return query.or(
      'action.like.admin.%,action.like.settings.%,action.like.student.%,action.like.teacher.%',
    );
  }
  return query;
}

export async function listActivityLogs(
  query: ListActivityLogsQuery,
): Promise<AdminActivityLogPage> {
  const supabase = getSupabaseAdmin();
  const page = Math.max(1, query.page);
  const pageSize = Math.min(100, Math.max(1, query.pageSize));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let dbQuery = supabase
    .from('admin_activity_logs')
    .select(
      'id, actor_id, actor_email, action, entity_type, entity_id, summary, metadata, created_at',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  dbQuery = applyCategoryFilter(dbQuery, query.category);

  if (query.action?.trim()) {
    dbQuery = dbQuery.eq('action', query.action.trim());
  }
  if (query.search?.trim()) {
    dbQuery = dbQuery.ilike('summary', `%${query.search.trim()}%`);
  }

  const { data, error, count } = await dbQuery;
  if (error) {
    if (error.message.toLowerCase().includes('does not exist')) {
      return { items: [], page, pageSize, total: 0, hasMore: false };
    }
    throw new AppError(500, 'ACTIVITY_LOGS_FAILED', error.message);
  }

  const items = (data ?? []) as AdminActivityLog[];
  const total = count ?? items.length;
  return {
    items,
    page,
    pageSize,
    total,
    hasMore: from + items.length < total,
  };
}

export async function exportActivityLogsCsv(
  query: Omit<ListActivityLogsQuery, 'page' | 'pageSize'> = {},
): Promise<AdminCsvExport> {
  const page = await listActivityLogs({
    page: 1,
    pageSize: 500,
    action: query.action,
    category: query.category,
    search: query.search,
  });
  const header = 'id,created_at,actor_email,action,entity_type,entity_id,summary';
  const lines = page.items.map((row) =>
    [
      row.id,
      row.created_at,
      row.actor_email ?? '',
      row.action,
      row.entity_type ?? '',
      row.entity_id ?? '',
      `"${row.summary.replace(/"/g, '""')}"`,
    ].join(','),
  );
  return {
    filename: `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`,
    csv: [header, ...lines].join('\n'),
  };
}

const ALLOWED_CLIENT_ACTIONS = new Set(['auth.login', 'auth.logout']);

/** Client-reported auth events (self only). */
export async function recordClientActivityEvent(input: {
  userId: string;
  email: string | null;
  action: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!ALLOWED_CLIENT_ACTIONS.has(input.action)) {
    throw new AppError(
      400,
      'ACTIVITY_ACTION_FORBIDDEN',
      'Only auth.login and auth.logout can be posted by clients',
    );
  }

  await writeActivityLog({
    actor_id: input.userId,
    actor_email: input.email,
    action: input.action,
    entity_type: 'user',
    entity_id: input.userId,
    summary:
      input.action === 'auth.login'
        ? `User logged in (${input.email ?? input.userId})`
        : `User logged out (${input.email ?? input.userId})`,
    metadata: { source: 'client', ...(input.metadata ?? {}) },
  });
}

export async function resolveActorEmail(userId: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .maybeSingle();
  return (data?.email as string | undefined) ?? null;
}
