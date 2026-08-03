/**
 * Bug report service — create with optional screenshot, list, admin status.
 */
import type {
  AdminBugReport,
  BugReport,
  BugReportScreenKey,
  BugReportStatus,
  UpdateBugReportStatusInput,
} from '@sharanam/shared';
import { BUG_REPORT_SCREEN_LABELS } from '@sharanam/shared';

import { env, isR2Configured } from '../config/env';
import { getSupabaseAdmin } from '../config/supabase';
import { securePutToR2 } from '../integrations/r2/client';
import {
  buildContentAddressedKey,
  UPLOAD_PROFILES,
  validateSecureUpload,
} from '../integrations/r2/fileSecurity';
import { AppError } from '../utils/AppError';

const COLUMNS =
  'id, ticket_number, user_id, description, screen_key, screen_label, screenshot_url, screenshot_storage_key, status, admin_note, resolved_at, closed_at, created_at, updated_at';

const FALLBACK_BUCKET = 'course-thumbnails';

type Row = {
  id: string;
  ticket_number: string;
  user_id: string;
  description: string;
  screen_key: string;
  screen_label: string;
  screenshot_url: string | null;
  screenshot_storage_key: string | null;
  status: string;
  admin_note: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapReport(row: Row): BugReport {
  return {
    id: row.id,
    ticket_number: row.ticket_number,
    user_id: row.user_id,
    description: row.description,
    screen_key: row.screen_key as BugReportScreenKey,
    screen_label: row.screen_label,
    screenshot_url: row.screenshot_url,
    status: row.status as BugReportStatus,
    admin_note: row.admin_note,
    resolved_at: row.resolved_at,
    closed_at: row.closed_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function nextTicketNumber(): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc('next_bug_ticket_number');
  if (!error && typeof data === 'string' && data.length > 0) {
    return data;
  }
  const year = new Date().getFullYear();
  return `BUG${year}${String(Date.now()).slice(-5)}`;
}

async function uploadScreenshot(
  userId: string,
  file: Express.Multer.File,
): Promise<{ url: string; storage_key: string }> {
  const validated = validateSecureUpload(
    {
      buffer: file.buffer,
      mimetype: file.mimetype,
      originalname: file.originalname,
      size: file.size,
    },
    UPLOAD_PROFILES.image,
  );

  if (isR2Configured()) {
    const uploaded = await securePutToR2({
      file: {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
        size: file.size,
      },
      kind: 'image',
      prefix: `bug-screenshots/${userId}`,
      cacheControl: 'private, max-age=86400',
      extraMetadata: { 'owner-user-id': userId },
    });
    return { url: uploaded.signed_url ?? uploaded.file_url, storage_key: uploaded.storage_key };
  }

  if (env.NODE_ENV === 'production') {
    throw new AppError(
      503,
      'R2_NOT_CONFIGURED',
      'Cloudflare R2 is required for screenshot uploads',
    );
  }

  const objectKey = buildContentAddressedKey(
    `bug-screenshots/${userId}`,
    validated.contentHash,
    validated.extension,
  );
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(FALLBACK_BUCKET).upload(objectKey, validated.buffer, {
    contentType: validated.mimeType,
    upsert: false,
  });
  if (error) {
    const msg = error.message.toLowerCase();
    if (!msg.includes('already exists') && !msg.includes('duplicate')) {
      throw new AppError(500, 'SCREENSHOT_UPLOAD_FAILED', error.message);
    }
  }
  const { data } = supabase.storage.from(FALLBACK_BUCKET).getPublicUrl(objectKey);
  return { url: data.publicUrl, storage_key: objectKey };
}

export async function createBugReport(
  userId: string,
  input: {
    description: string;
    screen_key: BugReportScreenKey;
  },
  file?: Express.Multer.File,
): Promise<BugReport> {
  const screenLabel = BUG_REPORT_SCREEN_LABELS[input.screen_key];
  if (!screenLabel) {
    throw new AppError(400, 'INVALID_SCREEN', 'Unknown screen selection');
  }

  let screenshotUrl: string | null = null;
  let screenshotKey: string | null = null;
  if (file) {
    const uploaded = await uploadScreenshot(userId, file);
    screenshotUrl = uploaded.url;
    screenshotKey = uploaded.storage_key;
  }

  const ticketNumber = await nextTicketNumber();
  const now = new Date().toISOString();
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('bug_reports')
    .insert({
      ticket_number: ticketNumber,
      user_id: userId,
      description: input.description.trim(),
      screen_key: input.screen_key,
      screen_label: screenLabel,
      screenshot_url: screenshotUrl,
      screenshot_storage_key: screenshotKey,
      status: 'open',
      created_at: now,
      updated_at: now,
    })
    .select(COLUMNS)
    .single();

  if (error) {
    throw new AppError(500, 'BUG_REPORT_CREATE_FAILED', error.message);
  }

  return mapReport(data as Row);
}

export async function listMyBugReports(userId: string): Promise<BugReport[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('bug_reports')
    .select(COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    throw new AppError(500, 'BUG_REPORT_FETCH_FAILED', error.message);
  }
  return ((data ?? []) as Row[]).map(mapReport);
}

export async function getMyBugReport(
  userId: string,
  reportId: string,
): Promise<BugReport> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('bug_reports')
    .select(COLUMNS)
    .eq('id', reportId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'BUG_REPORT_FETCH_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'BUG_REPORT_NOT_FOUND', 'Bug report not found');
  }
  return mapReport(data as Row);
}

export async function listAdminBugReports(filters?: {
  status?: BugReportStatus;
}): Promise<AdminBugReport[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('bug_reports')
    .select(COLUMNS)
    .order('created_at', { ascending: false })
    .limit(200);

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) {
    throw new AppError(500, 'BUG_REPORT_FETCH_FAILED', error.message);
  }

  const rows = (data ?? []) as Row[];
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const nameById = new Map<string, string>();
  const emailById = new Map<string, string>();

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

  return rows.map((row) => ({
    ...mapReport(row),
    student_name: nameById.get(row.user_id) ?? 'Student',
    student_email: emailById.get(row.user_id) ?? null,
  }));
}

export async function updateBugReportStatus(
  reportId: string,
  input: UpdateBugReportStatusInput,
  adminUserId: string,
): Promise<BugReport> {
  const supabase = getSupabaseAdmin();
  const { data: current, error: fetchError } = await supabase
    .from('bug_reports')
    .select(COLUMNS)
    .eq('id', reportId)
    .maybeSingle();

  if (fetchError) {
    throw new AppError(500, 'BUG_REPORT_FETCH_FAILED', fetchError.message);
  }
  if (!current) {
    throw new AppError(404, 'BUG_REPORT_NOT_FOUND', 'Bug report not found');
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
    .from('bug_reports')
    .update(patch)
    .eq('id', reportId)
    .select(COLUMNS)
    .single();

  if (error) {
    throw new AppError(500, 'BUG_REPORT_UPDATE_FAILED', error.message);
  }

  return mapReport(data as Row);
}
