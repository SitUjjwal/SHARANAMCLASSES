/**
 * Admin Feedback Dashboard — aggregate stats, searchable inbox, CSV export.
 *
 * Sources:
 *   course_reviews · student_feedback · bug_reports · support_conversations
 *
 * Feature requests = student_feedback.feedback_type = 'suggestion'
 * Support tickets  = student_feedback where type ≠ suggestion
 */
import type {
  FeedbackDashboardCategory,
  FeedbackDashboardCsvExport,
  FeedbackDashboardItem,
  FeedbackDashboardListPage,
  FeedbackDashboardSource,
  FeedbackDashboardStats,
} from '@sharanam/shared';

import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';

const MAX_SOURCE_ROWS = 300;
const MAX_EXPORT_ROWS = 1000;

export type FeedbackDashboardListQuery = {
  category?: FeedbackDashboardCategory;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

type ProfileLite = { name: string; email: string | null };

async function countExact(
  table: string,
  filters?: Array<{ op: 'eq' | 'neq'; col: string; val: string } | { op: 'in'; col: string; val: string[] }>,
): Promise<number> {
  const supabase = getSupabaseAdmin();
  let query: any = supabase.from(table).select('id', { count: 'exact', head: true });
  for (const f of filters ?? []) {
    if (f.op === 'eq') query = query.eq(f.col, f.val);
    else if (f.op === 'neq') query = query.neq(f.col, f.val);
    else query = query.in(f.col, f.val);
  }
  const { count, error } = await query;
  if (error) {
    throw new AppError(500, 'FEEDBACK_DASH_COUNT_FAILED', error.message);
  }
  return (count as number | null) ?? 0;
}

async function loadProfiles(userIds: string[]): Promise<Map<string, ProfileLite>> {
  const map = new Map<string, ProfileLite>();
  if (!userIds.length) return map;

  const supabase = getSupabaseAdmin();
  const unique = [...new Set(userIds)];
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', unique);

  if (error) {
    throw new AppError(500, 'PROFILES_FETCH_FAILED', error.message);
  }

  for (const p of data ?? []) {
    map.set(p.id as string, {
      name: ((p.full_name as string) || '').trim() || 'Student',
      email: (p.email as string) || null,
    });
  }
  return map;
}

function matchesSearch(item: FeedbackDashboardItem, search: string): boolean {
  if (!search) return true;
  const q = search.toLowerCase();
  return (
    item.ref.toLowerCase().includes(q) ||
    item.title.toLowerCase().includes(q) ||
    item.detail.toLowerCase().includes(q) ||
    item.student_name.toLowerCase().includes(q) ||
    (item.student_email ?? '').toLowerCase().includes(q) ||
    item.status.toLowerCase().includes(q)
  );
}

function matchesStatus(item: FeedbackDashboardItem, status?: string): boolean {
  if (!status || status === 'all') return true;
  return item.status === status;
}

function categoryOf(
  source: FeedbackDashboardSource,
  extra?: { reviewStatus?: string; feedbackType?: string },
): Exclude<FeedbackDashboardCategory, 'all'> {
  if (source === 'review') {
    return extra?.reviewStatus === 'approved'
      ? 'approved_reviews'
      : 'pending_reviews';
  }
  if (source === 'bug_report') return 'bug_reports';
  if (source === 'support_chat') return 'support_chat';
  if (extra?.feedbackType === 'suggestion') return 'feature_requests';
  return 'support_tickets';
}

async function fetchReviews(
  status: 'pending_approval' | 'approved',
): Promise<FeedbackDashboardItem[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('course_reviews')
    .select(
      'id, user_id, course_id, rating, comment, status, created_at, updated_at',
    )
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(MAX_SOURCE_ROWS);

  if (error) {
    throw new AppError(500, 'REVIEWS_FETCH_FAILED', error.message);
  }

  const rows = data ?? [];
  const profiles = await loadProfiles(rows.map((r) => r.user_id as string));
  const courseIds = [...new Set(rows.map((r) => r.course_id as string))];
  const titles = new Map<string, string>();
  if (courseIds.length) {
    const { data: courses } = await supabase
      .from('courses')
      .select('id, title')
      .in('id', courseIds);
    for (const c of courses ?? []) {
      titles.set(c.id as string, (c.title as string) ?? '');
    }
  }

  return rows.map((r) => {
    const profile = profiles.get(r.user_id as string);
    const courseTitle = titles.get(r.course_id as string) || 'Course';
    const comment = ((r.comment as string) || '').trim();
    return {
      id: r.id as string,
      source: 'review' as const,
      category: categoryOf('review', { reviewStatus: r.status as string }),
      ref: `REV-${(r.id as string).slice(0, 8)}`,
      title: `${r.rating}★ · ${courseTitle}`,
      detail: comment || '(no comment)',
      status: r.status as string,
      student_name: profile?.name ?? 'Student',
      student_email: profile?.email ?? null,
      created_at: r.created_at as string,
      updated_at: r.updated_at as string,
      admin_path: '/reviews',
    };
  });
}

async function fetchFeedback(kind: 'tickets' | 'features'): Promise<FeedbackDashboardItem[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('student_feedback')
    .select(
      'id, ticket_number, user_id, feedback_type, title, message, status, created_at, updated_at',
    )
    .order('created_at', { ascending: false })
    .limit(MAX_SOURCE_ROWS);

  if (kind === 'features') {
    query = query.eq('feedback_type', 'suggestion');
  } else {
    query = query.neq('feedback_type', 'suggestion');
  }

  const { data, error } = await query;
  if (error) {
    throw new AppError(500, 'FEEDBACK_FETCH_FAILED', error.message);
  }

  const rows = data ?? [];
  const profiles = await loadProfiles(rows.map((r) => r.user_id as string));

  return rows.map((r) => {
    const profile = profiles.get(r.user_id as string);
    const type = r.feedback_type as string;
    return {
      id: r.id as string,
      source: 'feedback' as const,
      category: categoryOf('feedback', { feedbackType: type }),
      ref: (r.ticket_number as string) || `FB-${(r.id as string).slice(0, 8)}`,
      title: (r.title as string) || (type === 'suggestion' ? 'Feature request' : 'Support ticket'),
      detail: (r.message as string) || '',
      status: r.status as string,
      student_name: profile?.name ?? 'Student',
      student_email: profile?.email ?? null,
      created_at: r.created_at as string,
      updated_at: r.updated_at as string,
      admin_path: '/feedback',
    };
  });
}

async function fetchBugReports(): Promise<FeedbackDashboardItem[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('bug_reports')
    .select(
      'id, ticket_number, user_id, description, screen_key, screen_label, status, created_at, updated_at',
    )
    .order('created_at', { ascending: false })
    .limit(MAX_SOURCE_ROWS);

  if (error) {
    throw new AppError(500, 'BUG_REPORTS_FETCH_FAILED', error.message);
  }

  const rows = data ?? [];
  const profiles = await loadProfiles(rows.map((r) => r.user_id as string));

  return rows.map((r) => {
    const profile = profiles.get(r.user_id as string);
    return {
      id: r.id as string,
      source: 'bug_report' as const,
      category: 'bug_reports' as const,
      ref: (r.ticket_number as string) || `BUG-${(r.id as string).slice(0, 8)}`,
      title: (r.screen_label as string) || (r.screen_key as string) || 'Bug report',
      detail: (r.description as string) || '',
      status: r.status as string,
      student_name: profile?.name ?? 'Student',
      student_email: profile?.email ?? null,
      created_at: r.created_at as string,
      updated_at: r.updated_at as string,
      admin_path: '/bug-reports',
    };
  });
}

async function fetchSupportChats(): Promise<FeedbackDashboardItem[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('support_conversations')
    .select(
      'id, user_id, status, last_message_preview, last_message_at, admin_last_read_at, created_at, updated_at',
    )
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(MAX_SOURCE_ROWS);

  if (error) {
    throw new AppError(500, 'CHAT_FETCH_FAILED', error.message);
  }

  const rows = data ?? [];
  const profiles = await loadProfiles(rows.map((r) => r.user_id as string));

  return rows.map((r) => {
    const profile = profiles.get(r.user_id as string);
    const lastAt = r.last_message_at as string | null;
    const readAt = r.admin_last_read_at as string | null;
    const needsAttention =
      Boolean(lastAt) && (!readAt || new Date(lastAt!).getTime() > new Date(readAt).getTime());
    return {
      id: r.id as string,
      source: 'support_chat' as const,
      category: 'support_chat' as const,
      ref: `CHAT-${(r.id as string).slice(0, 8)}`,
      title: needsAttention ? 'Support chat · needs reply' : 'Support chat',
      detail: ((r.last_message_preview as string) || '').trim() || '(no messages yet)',
      status: r.status as string,
      student_name: profile?.name ?? 'Student',
      student_email: profile?.email ?? null,
      created_at: lastAt || (r.created_at as string),
      updated_at: (r.updated_at as string) || (r.created_at as string),
      admin_path: '/support-chat',
    };
  });
}

async function collectItems(
  category: FeedbackDashboardCategory,
): Promise<FeedbackDashboardItem[]> {
  if (category === 'pending_reviews') return fetchReviews('pending_approval');
  if (category === 'approved_reviews') return fetchReviews('approved');
  if (category === 'bug_reports') return fetchBugReports();
  if (category === 'support_tickets') return fetchFeedback('tickets');
  if (category === 'feature_requests') return fetchFeedback('features');
  if (category === 'support_chat') return fetchSupportChats();

  const [pending, approved, bugs, tickets, features, chats] = await Promise.all([
    fetchReviews('pending_approval'),
    fetchReviews('approved'),
    fetchBugReports(),
    fetchFeedback('tickets'),
    fetchFeedback('features'),
    fetchSupportChats(),
  ]);

  return [...pending, ...approved, ...bugs, ...tickets, ...features, ...chats];
}

export async function getFeedbackDashboardStats(): Promise<FeedbackDashboardStats> {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const sinceIso = since.toISOString();

  const [
    pending_reviews,
    approved_reviews,
    rejected_reviews,
    bug_reports_open,
    bug_reports_total,
    support_tickets_open,
    support_tickets_total,
    feature_requests_open,
    feature_requests_total,
    support_chats_open,
    content_reports_open,
  ] = await Promise.all([
    countExact('course_reviews', [{ op: 'eq', col: 'status', val: 'pending_approval' }]),
    countExact('course_reviews', [{ op: 'eq', col: 'status', val: 'approved' }]),
    countExact('course_reviews', [{ op: 'eq', col: 'status', val: 'rejected' }]),
    countExact('bug_reports', [{ op: 'eq', col: 'status', val: 'open' }]),
    countExact('bug_reports'),
    countExact('student_feedback', [
      { op: 'neq', col: 'feedback_type', val: 'suggestion' },
      { op: 'in', col: 'status', val: ['open', 'in_progress'] },
    ]),
    countExact('student_feedback', [
      { op: 'neq', col: 'feedback_type', val: 'suggestion' },
    ]),
    countExact('student_feedback', [
      { op: 'eq', col: 'feedback_type', val: 'suggestion' },
      { op: 'in', col: 'status', val: ['open', 'in_progress'] },
    ]),
    countExact('student_feedback', [
      { op: 'eq', col: 'feedback_type', val: 'suggestion' },
    ]),
    countExact('support_conversations', [{ op: 'eq', col: 'status', val: 'open' }]),
    countExact('content_reports', [{ op: 'eq', col: 'status', val: 'open' }]),
  ]);

  const supabase = getSupabaseAdmin();

  const [reviewsWeek, feedbackWeek, bugsWeek, chatsWeek] = await Promise.all([
    supabase
      .from('course_reviews')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sinceIso),
    supabase
      .from('student_feedback')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sinceIso),
    supabase
      .from('bug_reports')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sinceIso),
    supabase
      .from('support_conversations')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sinceIso),
  ]);

  for (const res of [reviewsWeek, feedbackWeek, bugsWeek, chatsWeek]) {
    if (res.error) {
      throw new AppError(500, 'FEEDBACK_DASH_COUNT_FAILED', res.error.message);
    }
  }

  const submitted_last_7_days =
    (reviewsWeek.count ?? 0) +
    (feedbackWeek.count ?? 0) +
    (bugsWeek.count ?? 0) +
    (chatsWeek.count ?? 0);

  const [fbResolved, bugsResolved] = await Promise.all([
    supabase
      .from('student_feedback')
      .select('id', { count: 'exact', head: true })
      .in('status', ['resolved', 'closed'])
      .gte('updated_at', sinceIso),
    supabase
      .from('bug_reports')
      .select('id', { count: 'exact', head: true })
      .in('status', ['resolved', 'closed'])
      .gte('updated_at', sinceIso),
  ]);

  if (fbResolved.error || bugsResolved.error) {
    throw new AppError(
      500,
      'FEEDBACK_DASH_COUNT_FAILED',
      fbResolved.error?.message || bugsResolved.error?.message || 'count failed',
    );
  }

  const { data: chatRows, error: chatError } = await supabase
    .from('support_conversations')
    .select('last_message_at, admin_last_read_at')
    .eq('status', 'open')
    .limit(500);

  if (chatError) {
    throw new AppError(500, 'CHAT_FETCH_FAILED', chatError.message);
  }

  const support_chats_unread = (chatRows ?? []).filter((row) => {
    const lastAt = row.last_message_at as string | null;
    const readAt = row.admin_last_read_at as string | null;
    if (!lastAt) return false;
    if (!readAt) return true;
    return new Date(lastAt).getTime() > new Date(readAt).getTime();
  }).length;

  return {
    pending_reviews,
    approved_reviews,
    rejected_reviews,
    bug_reports_open,
    bug_reports_total,
    support_tickets_open,
    support_tickets_total,
    feature_requests_open,
    feature_requests_total,
    support_chats_open,
    support_chats_unread,
    content_reports_open,
    submitted_last_7_days,
    resolved_last_7_days: (fbResolved.count ?? 0) + (bugsResolved.count ?? 0),
  };
}

export async function listFeedbackDashboardItems(
  query: FeedbackDashboardListQuery,
): Promise<FeedbackDashboardListPage> {
  const category = query.category ?? 'all';
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  const search = (query.search ?? '').trim();
  const status = query.status ?? 'all';

  let items = await collectItems(category);
  items = items
    .filter((item) => matchesStatus(item, status))
    .filter((item) => matchesSearch(item, search))
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

  const total = items.length;
  const from = (page - 1) * pageSize;
  const pageItems = items.slice(from, from + pageSize);

  return {
    items: pageItems,
    page,
    pageSize,
    total,
    hasMore: from + pageItems.length < total,
  };
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function exportFeedbackDashboardCsv(
  query: Omit<FeedbackDashboardListQuery, 'page' | 'pageSize'>,
): Promise<FeedbackDashboardCsvExport> {
  const page = await listFeedbackDashboardItems({
    ...query,
    page: 1,
    pageSize: MAX_EXPORT_ROWS,
  });

  const header = [
    'Category',
    'Source',
    'Ref',
    'Title',
    'Detail',
    'Status',
    'Student',
    'Email',
    'Created At',
    'Updated At',
    'Admin Path',
  ];

  const lines = [
    header.join(','),
    ...page.items.map((row) =>
      [
        row.category,
        row.source,
        row.ref,
        row.title,
        row.detail.replace(/\s+/g, ' ').slice(0, 500),
        row.status,
        row.student_name,
        row.student_email ?? '',
        row.created_at,
        row.updated_at,
        row.admin_path,
      ]
        .map((cell) => csvEscape(String(cell)))
        .join(','),
    ),
  ];

  const day = new Date().toISOString().slice(0, 10);
  return {
    filename: `sharanam-feedback-dashboard-${day}.csv`,
    csv: `${lines.join('\n')}\n`,
  };
}
