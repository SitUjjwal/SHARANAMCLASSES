/**
 * Live class catalog — YouTube Live URL + schedule in PostgreSQL.
 * Notify → app_updates (in-app) + notification_sent_at.
 */
import type { LiveClass, LiveClassPublic, LiveClassStatus } from '@sharanam/shared';

import { getSupabaseAdmin } from '../config/supabase';
import { emitLiveClassScheduled } from '../events';
import { AppError } from '../utils/AppError';
import { parseYouTubeUrl, youtubeThumbnailUrl } from '../utils/youtube';
import type {
  CreateLiveClassInput,
  ListLiveClassesQuery,
  NotifyLiveClassInput,
  UpdateLiveClassInput,
} from '../validators/liveClass.validators';

const LIVE_COLUMNS =
  'id, course_id, title, description, youtube_url, youtube_video_id, thumbnail_url, start_time, end_time, is_published, notification_sent_at, created_at, updated_at';

export type LiveClassListPage = {
  items: LiveClass[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export function deriveLiveClassStatus(
  startTime: string,
  endTime: string,
  nowMs = Date.now(),
): LiveClassStatus {
  const start = Date.parse(startTime);
  const end = Date.parse(endTime);
  if (Number.isNaN(start) || Number.isNaN(end)) return 'ended';
  if (nowMs < start) return 'upcoming';
  if (nowMs <= end) return 'live';
  return 'ended';
}

async function assertCourseOptional(
  courseId: string | null | undefined,
): Promise<string | null> {
  if (!courseId) return null;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('courses')
    .select('id, title')
    .eq('id', courseId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'COURSE_LOOKUP_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found');
  }
  return data.title as string;
}

function toLiveClass(
  row: Record<string, unknown>,
  courseTitle?: string | null,
): LiveClass {
  const start_time = row.start_time as string;
  const end_time = row.end_time as string;
  return {
    id: row.id as string,
    course_id: (row.course_id as string | null) ?? null,
    title: row.title as string,
    description: (row.description as string) ?? '',
    youtube_url: row.youtube_url as string,
    youtube_video_id: row.youtube_video_id as string,
    thumbnail_url: (row.thumbnail_url as string | null) ?? null,
    start_time,
    end_time,
    is_published: Boolean(row.is_published),
    notification_sent_at: (row.notification_sent_at as string | null) ?? null,
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
    course_title: courseTitle ?? null,
    status: deriveLiveClassStatus(start_time, end_time),
  };
}

export async function listLiveClassesForAdmin(
  filters: ListLiveClassesQuery,
): Promise<LiveClassListPage> {
  const supabase = getSupabaseAdmin();
  const page = filters.page;
  const pageSize = filters.pageSize;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('live_classes')
    .select(LIVE_COLUMNS, { count: 'exact' })
    .order('start_time', { ascending: true })
    .range(from, to);

  if (filters.courseId) {
    query = query.eq('course_id', filters.courseId);
  }
  if (filters.publishStatus === 'published') {
    query = query.eq('is_published', true);
  } else if (filters.publishStatus === 'draft') {
    query = query.eq('is_published', false);
  }

  const search = filters.search?.trim();
  if (search) {
    const safe = search.replace(/[%_,.()']/g, '');
    if (safe) {
      query = query.or(
        `title.ilike.%${safe}%,description.ilike.%${safe}%,youtube_video_id.ilike.%${safe}%`,
      );
    }
  }

  const { data, error, count } = await query;
  if (error) {
    throw new AppError(500, 'LIVE_CLASSES_FETCH_FAILED', error.message);
  }

  let rows = (data ?? []) as Record<string, unknown>[];

  if (filters.status !== 'all') {
    rows = rows.filter(
      (row) =>
        deriveLiveClassStatus(row.start_time as string, row.end_time as string) ===
        filters.status,
    );
  }

  const courseIds = [
    ...new Set(rows.map((r) => r.course_id as string | null).filter(Boolean)),
  ] as string[];

  const { data: courses } = courseIds.length
    ? await supabase.from('courses').select('id, title').in('id', courseIds)
    : { data: [] as { id: string; title: string }[] };

  const courseMap = new Map((courses ?? []).map((c) => [c.id, c.title]));

  const items = rows.map((row) =>
    toLiveClass(row, row.course_id ? courseMap.get(row.course_id as string) ?? null : null),
  );
  const total = filters.status === 'all' ? (count ?? 0) : items.length;

  return {
    items,
    page,
    pageSize,
    total,
    hasMore: filters.status === 'all' ? from + items.length < total : false,
  };
}

export async function getLiveClassForAdmin(liveClassId: string): Promise<LiveClass> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('live_classes')
    .select(LIVE_COLUMNS)
    .eq('id', liveClassId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'LIVE_CLASS_FETCH_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'LIVE_CLASS_NOT_FOUND', 'Live class not found');
  }

  const courseTitle = await assertCourseOptional(data.course_id as string | null);
  return toLiveClass(data as Record<string, unknown>, courseTitle);
}

export async function createLiveClass(input: CreateLiveClassInput): Promise<LiveClass> {
  const courseTitle = await assertCourseOptional(input.course_id ?? null);

  let parsed;
  try {
    parsed = parseYouTubeUrl(input.youtube_url);
  } catch (err) {
    throw new AppError(
      400,
      'INVALID_YOUTUBE_URL',
      err instanceof Error ? err.message : 'Invalid YouTube URL',
    );
  }

  const start = Date.parse(input.start_time);
  const end = Date.parse(input.end_time);
  if (end <= start) {
    throw new AppError(400, 'INVALID_SCHEDULE', 'End time must be after start time');
  }

  const thumbnail =
    input.thumbnail_url?.trim() || youtubeThumbnailUrl(parsed.youtube_video_id);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('live_classes')
    .insert({
      course_id: input.course_id ?? null,
      title: input.title,
      description: input.description ?? '',
      youtube_url: parsed.youtube_url,
      youtube_video_id: parsed.youtube_video_id,
      thumbnail_url: thumbnail,
      start_time: new Date(start).toISOString(),
      end_time: new Date(end).toISOString(),
      is_published: input.is_published ?? true,
      updated_at: new Date().toISOString(),
    })
    .select(LIVE_COLUMNS)
    .single();

  if (error) {
    throw new AppError(400, 'LIVE_CLASS_CREATE_FAILED', error.message);
  }

  const liveClass = toLiveClass(data as Record<string, unknown>, courseTitle);
  if (liveClass.is_published) {
    emitLiveClassScheduled({
      live_class_id: liveClass.id,
      course_id: liveClass.course_id,
      title: liveClass.title,
      start_time: liveClass.start_time,
    });
  }
  return liveClass;
}

export async function updateLiveClass(
  liveClassId: string,
  input: UpdateLiveClassInput,
): Promise<LiveClass> {
  const supabase = getSupabaseAdmin();
  const { data: existing, error: lookupError } = await supabase
    .from('live_classes')
    .select(LIVE_COLUMNS)
    .eq('id', liveClassId)
    .maybeSingle();

  if (lookupError) {
    throw new AppError(500, 'LIVE_CLASS_FETCH_FAILED', lookupError.message);
  }
  if (!existing) {
    throw new AppError(404, 'LIVE_CLASS_NOT_FOUND', 'Live class not found');
  }

  const courseId =
    input.course_id !== undefined
      ? input.course_id
      : ((existing.course_id as string | null) ?? null);
  const courseTitle = await assertCourseOptional(courseId);

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.course_id !== undefined) patch.course_id = courseId;
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.thumbnail_url !== undefined) patch.thumbnail_url = input.thumbnail_url;
  if (input.is_published !== undefined) patch.is_published = input.is_published;

  const nextStart = input.start_time ?? (existing.start_time as string);
  const nextEnd = input.end_time ?? (existing.end_time as string);
  if (input.start_time !== undefined || input.end_time !== undefined) {
    const start = Date.parse(nextStart);
    const end = Date.parse(nextEnd);
    if (end <= start) {
      throw new AppError(400, 'INVALID_SCHEDULE', 'End time must be after start time');
    }
    if (input.start_time !== undefined) {
      patch.start_time = new Date(start).toISOString();
    }
    if (input.end_time !== undefined) {
      patch.end_time = new Date(end).toISOString();
    }
  }

  if (input.youtube_url !== undefined) {
    try {
      const parsed = parseYouTubeUrl(input.youtube_url);
      patch.youtube_url = parsed.youtube_url;
      patch.youtube_video_id = parsed.youtube_video_id;
      if (input.thumbnail_url === undefined && !existing.thumbnail_url) {
        patch.thumbnail_url = youtubeThumbnailUrl(parsed.youtube_video_id);
      }
    } catch (err) {
      throw new AppError(
        400,
        'INVALID_YOUTUBE_URL',
        err instanceof Error ? err.message : 'Invalid YouTube URL',
      );
    }
  }

  const { data, error } = await supabase
    .from('live_classes')
    .update(patch)
    .eq('id', liveClassId)
    .select(LIVE_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new AppError(400, 'LIVE_CLASS_UPDATE_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'LIVE_CLASS_NOT_FOUND', 'Live class not found');
  }

  return toLiveClass(data as Record<string, unknown>, courseTitle);
}

export async function deleteLiveClass(liveClassId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: existing, error: lookupError } = await supabase
    .from('live_classes')
    .select('id')
    .eq('id', liveClassId)
    .maybeSingle();

  if (lookupError) {
    throw new AppError(500, 'LIVE_CLASS_FETCH_FAILED', lookupError.message);
  }
  if (!existing) {
    throw new AppError(404, 'LIVE_CLASS_NOT_FOUND', 'Live class not found');
  }

  const { error } = await supabase.from('live_classes').delete().eq('id', liveClassId);
  if (error) {
    throw new AppError(400, 'LIVE_CLASS_DELETE_FAILED', error.message);
  }
}

/**
 * Publish an in-app announcement (app_updates) and mark notification_sent_at.
 * Push/FCM is not wired yet — this is the production-safe notification path today.
 */
export async function notifyLiveClass(
  liveClassId: string,
  input: NotifyLiveClassInput = {},
): Promise<LiveClass> {
  const live = await getLiveClassForAdmin(liveClassId);
  if (!live.is_published) {
    throw new AppError(
      400,
      'LIVE_CLASS_NOT_PUBLISHED',
      'Publish the live class before sending a notification',
    );
  }

  const startLabel = new Date(live.start_time).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const title = input.title?.trim() || `Live class: ${live.title}`;
  const body =
    input.body?.trim() ||
    `Join “${live.title}” starting ${startLabel}.${
      live.course_title ? ` Course: ${live.course_title}.` : ''
    }`;

  const supabase = getSupabaseAdmin();
  const { error: updateError } = await supabase.from('app_updates').insert({
    title,
    body,
    is_published: true,
    published_at: new Date().toISOString(),
  });

  if (updateError) {
    throw new AppError(500, 'NOTIFICATION_CREATE_FAILED', updateError.message);
  }

  const { data, error } = await supabase
    .from('live_classes')
    .update({
      notification_sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', liveClassId)
    .select(LIVE_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    throw new AppError(
      500,
      'LIVE_CLASS_NOTIFY_FAILED',
      error?.message || 'Failed to mark notification as sent',
    );
  }

  return toLiveClass(data as Record<string, unknown>, live.course_title ?? null);
}

/** Published live classes for students (optional course filter). */
export async function listLiveClassesPublic(options?: {
  courseId?: string;
}): Promise<LiveClassPublic[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('live_classes')
    .select(LIVE_COLUMNS)
    .eq('is_published', true)
    .order('start_time', { ascending: true });

  if (options?.courseId) {
    query = query.eq('course_id', options.courseId);
  }

  const { data, error } = await query;
  if (error) {
    throw new AppError(500, 'LIVE_CLASSES_FETCH_FAILED', error.message);
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  const courseIds = [
    ...new Set(rows.map((r) => r.course_id as string | null).filter(Boolean)),
  ] as string[];

  const { data: courses } = courseIds.length
    ? await supabase
        .from('courses')
        .select('id, title, teacher_name')
        .in('id', courseIds)
    : { data: [] as { id: string; title: string; teacher_name: string | null }[] };
  const courseMap = new Map(
    (courses ?? []).map((c) => [
      c.id,
      { title: c.title, teacher_name: c.teacher_name ?? null },
    ]),
  );

  return rows.map((row) => {
    const status = deriveLiveClassStatus(
      row.start_time as string,
      row.end_time as string,
    );
    const course = row.course_id
      ? courseMap.get(row.course_id as string)
      : undefined;
    // Hide stream URL after class ends
    const showUrl = status === 'live' || status === 'upcoming';
    return {
      id: row.id as string,
      course_id: (row.course_id as string | null) ?? null,
      course_title: course?.title ?? null,
      teacher_name: course?.teacher_name ?? null,
      title: row.title as string,
      description: (row.description as string) ?? '',
      thumbnail_url: (row.thumbnail_url as string | null) ?? null,
      start_time: row.start_time as string,
      end_time: row.end_time as string,
      status,
      youtube_url: showUrl ? (row.youtube_url as string) : null,
    };
  });
}
