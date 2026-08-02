/**
 * Announcement service — Home feed + admin CRUD.
 *
 * Visibility on Home:
 *   is_published = true AND scheduled_at <= now()
 * Order: is_pinned DESC, scheduled_at DESC
 */
import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import type { Announcement } from '@sharanam/shared';
import type {
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
} from '../validators/announcement.validators';

const COLUMNS =
  'id, title, body, image_url, is_pinned, is_published, scheduled_at, published_at, sort_order, created_at, updated_at';

function mapRow(row: Record<string, unknown>): Announcement {
  return {
    id: String(row.id),
    title: String(row.title),
    body: String(row.body ?? ''),
    image_url: (row.image_url as string | null) ?? null,
    is_pinned: Boolean(row.is_pinned),
    is_published: Boolean(row.is_published),
    scheduled_at: String(row.scheduled_at),
    published_at: String(row.published_at),
    sort_order: Number(row.sort_order) || 0,
    created_at: row.created_at ? String(row.created_at) : undefined,
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
  };
}

/** Student Home — published + due schedule, pinned first. */
export async function listPublishedAnnouncements(limit = 12): Promise<Announcement[]> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('announcements')
    .select(COLUMNS)
    .eq('is_published', true)
    .lte('scheduled_at', now)
    .order('is_pinned', { ascending: false })
    .order('scheduled_at', { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 50));

  if (error) {
    throw new AppError(500, 'ANNOUNCEMENTS_FETCH_FAILED', error.message);
  }
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function listAllAnnouncementsForAdmin(): Promise<Announcement[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('announcements')
    .select(COLUMNS)
    .order('is_pinned', { ascending: false })
    .order('scheduled_at', { ascending: false });

  if (error) {
    throw new AppError(500, 'ANNOUNCEMENTS_FETCH_FAILED', error.message);
  }
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function createAnnouncement(
  input: CreateAnnouncementInput,
  createdBy: string | null,
): Promise<Announcement> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const scheduledAt = input.scheduled_at ?? now;

  const { data, error } = await supabase
    .from('announcements')
    .insert({
      title: input.title,
      body: input.body ?? '',
      image_url: input.image_url ?? null,
      is_pinned: input.is_pinned ?? false,
      is_published: input.is_published ?? true,
      scheduled_at: scheduledAt,
      published_at: scheduledAt,
      sort_order: input.sort_order ?? 0,
      created_by: createdBy,
      created_at: now,
      updated_at: now,
    })
    .select(COLUMNS)
    .single();

  if (error || !data) {
    throw new AppError(
      400,
      'ANNOUNCEMENT_CREATE_FAILED',
      error?.message ?? 'Could not create announcement',
    );
  }
  return mapRow(data as Record<string, unknown>);
}

export async function updateAnnouncement(
  announcementId: string,
  input: UpdateAnnouncementInput,
): Promise<Announcement> {
  const supabase = getSupabaseAdmin();
  const patch: Record<string, unknown> = {
    ...input,
    updated_at: new Date().toISOString(),
  };
  if (input.scheduled_at) {
    patch.published_at = input.scheduled_at;
  }

  const { data, error } = await supabase
    .from('announcements')
    .update(patch)
    .eq('id', announcementId)
    .select(COLUMNS)
    .maybeSingle();

  if (error) {
    throw new AppError(400, 'ANNOUNCEMENT_UPDATE_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'ANNOUNCEMENT_NOT_FOUND', 'Announcement not found');
  }
  return mapRow(data as Record<string, unknown>);
}

export async function deleteAnnouncement(announcementId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error, count } = await supabase
    .from('announcements')
    .delete({ count: 'exact' })
    .eq('id', announcementId);

  if (error) {
    throw new AppError(400, 'ANNOUNCEMENT_DELETE_FAILED', error.message);
  }
  if (!count) {
    throw new AppError(404, 'ANNOUNCEMENT_NOT_FOUND', 'Announcement not found');
  }
}
