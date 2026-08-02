/**
 * Content report service — student submit + admin triage.
 */
import type {
  AdminContentReport,
  ContentReport,
  ContentReportStatus,
  ContentReportType,
  SubmitContentReportInput,
  UpdateContentReportStatusInput,
} from '@sharanam/shared';
import { CONTENT_REPORT_TYPE_LABELS } from '@sharanam/shared';

import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';

const COLUMNS =
  'id, ticket_number, user_id, report_type, description, target_type, target_id, course_id, chapter_id, target_label, status, admin_note, resolved_at, closed_at, created_at, updated_at';

type Row = {
  id: string;
  ticket_number: string;
  user_id: string;
  report_type: string;
  description: string;
  target_type: string | null;
  target_id: string | null;
  course_id: string | null;
  chapter_id: string | null;
  target_label: string | null;
  status: string;
  admin_note: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapReport(row: Row): ContentReport {
  return {
    id: row.id,
    ticket_number: row.ticket_number,
    user_id: row.user_id,
    report_type: row.report_type as ContentReportType,
    description: row.description,
    target_type: (row.target_type as ContentReport['target_type']) ?? null,
    target_id: row.target_id,
    course_id: row.course_id,
    chapter_id: row.chapter_id,
    target_label: row.target_label,
    status: row.status as ContentReportStatus,
    admin_note: row.admin_note,
    resolved_at: row.resolved_at,
    closed_at: row.closed_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function nextTicketNumber(): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc('next_content_report_ticket_number');
  if (!error && typeof data === 'string' && data.length > 0) {
    return data;
  }
  return `CR${new Date().getFullYear()}${String(Date.now()).slice(-5)}`;
}

function defaultTargetType(
  reportType: ContentReportType,
): ContentReport['target_type'] {
  switch (reportType) {
    case 'incorrect_video':
      return 'video';
    case 'wrong_pdf':
      return 'pdf';
    case 'broken_link':
      return 'note';
    case 'incorrect_question':
      return 'question';
    case 'duplicate_content':
      return 'other';
    default:
      return 'other';
  }
}

export async function createContentReport(
  userId: string,
  input: SubmitContentReportInput,
): Promise<ContentReport> {
  if (!CONTENT_REPORT_TYPE_LABELS[input.report_type]) {
    throw new AppError(400, 'INVALID_REPORT_TYPE', 'Unknown report type');
  }

  const ticketNumber = await nextTicketNumber();
  const now = new Date().toISOString();
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('content_reports')
    .insert({
      ticket_number: ticketNumber,
      user_id: userId,
      report_type: input.report_type,
      description: input.description.trim(),
      target_type: input.target_type ?? defaultTargetType(input.report_type),
      target_id: input.target_id ?? null,
      course_id: input.course_id ?? null,
      chapter_id: input.chapter_id ?? null,
      target_label: input.target_label?.trim() || null,
      status: 'open',
      created_at: now,
      updated_at: now,
    })
    .select(COLUMNS)
    .single();

  if (error) {
    throw new AppError(500, 'CONTENT_REPORT_CREATE_FAILED', error.message);
  }

  return mapReport(data as Row);
}

export async function listMyContentReports(userId: string): Promise<ContentReport[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('content_reports')
    .select(COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    throw new AppError(500, 'CONTENT_REPORT_FETCH_FAILED', error.message);
  }
  return ((data ?? []) as Row[]).map(mapReport);
}

export async function getMyContentReport(
  userId: string,
  reportId: string,
): Promise<ContentReport> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('content_reports')
    .select(COLUMNS)
    .eq('id', reportId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'CONTENT_REPORT_FETCH_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'CONTENT_REPORT_NOT_FOUND', 'Report not found');
  }
  return mapReport(data as Row);
}

export async function listAdminContentReports(filters?: {
  status?: ContentReportStatus;
  report_type?: ContentReportType;
}): Promise<AdminContentReport[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('content_reports')
    .select(COLUMNS)
    .order('created_at', { ascending: false })
    .limit(200);

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.report_type) query = query.eq('report_type', filters.report_type);

  const { data, error } = await query;
  if (error) {
    throw new AppError(500, 'CONTENT_REPORT_FETCH_FAILED', error.message);
  }

  const rows = (data ?? []) as Row[];
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const courseIds = [...new Set(rows.map((r) => r.course_id).filter(Boolean))] as string[];

  const nameById = new Map<string, string>();
  const emailById = new Map<string, string>();
  const courseTitle = new Map<string, string>();

  if (userIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);
    for (const p of profiles ?? []) {
      nameById.set(p.id as string, ((p.full_name as string) || '').trim() || 'Student');
      emailById.set(p.id as string, (p.email as string) || '');
    }
  }

  if (courseIds.length) {
    const { data: courses } = await supabase
      .from('courses')
      .select('id, title')
      .in('id', courseIds);
    for (const c of courses ?? []) {
      courseTitle.set(c.id as string, (c.title as string) || '');
    }
  }

  return rows.map((row) => ({
    ...mapReport(row),
    student_name: nameById.get(row.user_id) ?? 'Student',
    student_email: emailById.get(row.user_id) ?? null,
    course_title: row.course_id ? courseTitle.get(row.course_id) ?? null : null,
  }));
}

export async function updateContentReportStatus(
  reportId: string,
  input: UpdateContentReportStatusInput,
  adminUserId: string,
): Promise<ContentReport> {
  const supabase = getSupabaseAdmin();
  const { data: current, error: fetchError } = await supabase
    .from('content_reports')
    .select(COLUMNS)
    .eq('id', reportId)
    .maybeSingle();

  if (fetchError) {
    throw new AppError(500, 'CONTENT_REPORT_FETCH_FAILED', fetchError.message);
  }
  if (!current) {
    throw new AppError(404, 'CONTENT_REPORT_NOT_FOUND', 'Report not found');
  }

  const now = new Date().toISOString();
  const status = input.status;
  const patch: Record<string, unknown> = {
    status,
    updated_at: now,
    assigned_to: adminUserId,
  };

  if (input.admin_note !== undefined) {
    patch.admin_note = input.admin_note?.trim() || null;
  }

  if (status === 'resolved') {
    patch.resolved_at = now;
    patch.closed_at = null;
  } else if (status === 'closed') {
    patch.closed_at = now;
    if (!(current as Row).resolved_at) patch.resolved_at = now;
  } else {
    patch.resolved_at = null;
    patch.closed_at = null;
  }

  const { data, error } = await supabase
    .from('content_reports')
    .update(patch)
    .eq('id', reportId)
    .select(COLUMNS)
    .single();

  if (error) {
    throw new AppError(500, 'CONTENT_REPORT_UPDATE_FAILED', error.message);
  }

  return mapReport(data as Row);
}
