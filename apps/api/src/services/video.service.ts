/**
 * Video catalog — YouTube URL only in PostgreSQL; admin CRUD + student public list.
 */
import type { Video, VideoPublic } from '@sharanam/shared';

import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import { parseYouTubeUrl, youtubeThumbnailUrl } from '../utils/youtube';
import type {
  CreateVideoInput,
  ListVideosQuery,
  UpdateVideoInput,
} from '../validators/video.validators';
import { isMediaLocked } from './courseAccess.service';

const VIDEO_COLUMNS =
  'id, course_id, chapter_id, title, description, youtube_url, youtube_video_id, video_type, thumbnail_url, duration_seconds, sort_order, is_free, is_published, created_at, updated_at';

export type VideoListPage = {
  items: Video[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

async function assertChapterBelongsToCourse(
  courseId: string,
  chapterId: string,
): Promise<{ course_title: string; chapter_title: string }> {
  const supabase = getSupabaseAdmin();
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title')
    .eq('id', courseId)
    .maybeSingle();

  if (courseError) {
    throw new AppError(500, 'COURSE_LOOKUP_FAILED', courseError.message);
  }
  if (!course) {
    throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found');
  }

  const { data: chapter, error: chapterError } = await supabase
    .from('chapters')
    .select('id, title, course_id')
    .eq('id', chapterId)
    .maybeSingle();

  if (chapterError) {
    throw new AppError(500, 'CHAPTER_LOOKUP_FAILED', chapterError.message);
  }
  if (!chapter) {
    throw new AppError(404, 'CHAPTER_NOT_FOUND', 'Chapter not found');
  }
  if (chapter.course_id !== courseId) {
    throw new AppError(
      400,
      'CHAPTER_COURSE_MISMATCH',
      'Selected chapter does not belong to the selected course',
    );
  }

  return {
    course_title: course.title as string,
    chapter_title: chapter.title as string,
  };
}

async function syncChapterVideoCount(chapterId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from('videos')
    .select('id', { count: 'exact', head: true })
    .eq('chapter_id', chapterId)
    .eq('is_published', true);

  if (error) {
    throw new AppError(500, 'VIDEO_COUNT_SYNC_FAILED', error.message);
  }

  const { data: contents } = await supabase
    .from('chapter_contents')
    .select('id')
    .eq('chapter_id', chapterId)
    .eq('content_type', 'video');

  const legacy = contents?.length ?? 0;
  const video_count = (count ?? 0) + legacy;

  const { data: durationRows } = await supabase
    .from('videos')
    .select('duration_seconds')
    .eq('chapter_id', chapterId)
    .eq('is_published', true);

  const fromVideos = (durationRows ?? []).reduce(
    (sum, row) => sum + (Number(row.duration_seconds) || 0),
    0,
  );

  const { error: updateError } = await supabase
    .from('chapters')
    .update({
      video_count,
      duration_seconds: fromVideos,
      updated_at: new Date().toISOString(),
    })
    .eq('id', chapterId);

  if (updateError) {
    throw new AppError(500, 'CHAPTER_META_SYNC_FAILED', updateError.message);
  }
}

function toVideo(row: Record<string, unknown>, titles?: {
  course_title?: string | null;
  chapter_title?: string | null;
}): Video {
  return {
    id: row.id as string,
    course_id: row.course_id as string,
    chapter_id: row.chapter_id as string,
    title: row.title as string,
    description: (row.description as string) ?? '',
    youtube_url: row.youtube_url as string,
    youtube_video_id: row.youtube_video_id as string,
    video_type: row.video_type as Video['video_type'],
    thumbnail_url: (row.thumbnail_url as string | null) ?? null,
    duration_seconds: Number(row.duration_seconds) || 0,
    sort_order: Number(row.sort_order) || 0,
    is_free: Boolean(row.is_free),
    is_published: Boolean(row.is_published),
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
    course_title: titles?.course_title ?? null,
    chapter_title: titles?.chapter_title ?? null,
  };
}

export async function listVideosForAdmin(filters: ListVideosQuery): Promise<VideoListPage> {
  const supabase = getSupabaseAdmin();
  const page = filters.page;
  const pageSize = filters.pageSize;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('videos')
    .select(VIDEO_COLUMNS, { count: 'exact' })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filters.courseId) {
    query = query.eq('course_id', filters.courseId);
  }
  if (filters.chapterId) {
    query = query.eq('chapter_id', filters.chapterId);
  }
  if (filters.videoType === 'recorded' || filters.videoType === 'live') {
    query = query.eq('video_type', filters.videoType);
  }
  if (filters.access === 'free') {
    query = query.eq('is_free', true);
  } else if (filters.access === 'paid') {
    query = query.eq('is_free', false);
  }
  if (filters.status === 'published') {
    query = query.eq('is_published', true);
  } else if (filters.status === 'draft') {
    query = query.eq('is_published', false);
  }

  const search = filters.search?.trim();
  if (search) {
    const safe = search.replace(/[%_,.()]/g, '');
    if (safe) {
      query = query.or(
        `title.ilike.%${safe}%,description.ilike.%${safe}%,youtube_video_id.ilike.%${safe}%`,
      );
    }
  }

  const { data, error, count } = await query;
  if (error) {
    throw new AppError(500, 'VIDEOS_FETCH_FAILED', error.message);
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  const courseIds = [...new Set(rows.map((r) => r.course_id as string))];
  const chapterIds = [...new Set(rows.map((r) => r.chapter_id as string))];

  const [{ data: courses }, { data: chapters }] = await Promise.all([
    courseIds.length
      ? supabase.from('courses').select('id, title').in('id', courseIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    chapterIds.length
      ? supabase.from('chapters').select('id, title').in('id', chapterIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  const courseMap = new Map((courses ?? []).map((c) => [c.id, c.title]));
  const chapterMap = new Map((chapters ?? []).map((c) => [c.id, c.title]));

  const items = rows.map((row) =>
    toVideo(row, {
      course_title: courseMap.get(row.course_id as string) ?? null,
      chapter_title: chapterMap.get(row.chapter_id as string) ?? null,
    }),
  );
  const total = count ?? 0;

  return {
    items,
    page,
    pageSize,
    total,
    hasMore: from + items.length < total,
  };
}

export async function getVideoForAdmin(videoId: string): Promise<Video> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('videos')
    .select(VIDEO_COLUMNS)
    .eq('id', videoId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'VIDEO_FETCH_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'VIDEO_NOT_FOUND', 'Video not found');
  }

  const titles = await assertChapterBelongsToCourse(
    data.course_id as string,
    data.chapter_id as string,
  );
  return toVideo(data as Record<string, unknown>, titles);
}

export async function createVideo(input: CreateVideoInput): Promise<Video> {
  const titles = await assertChapterBelongsToCourse(input.course_id, input.chapter_id);
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

  let sortOrder = input.sort_order;
  if (sortOrder === undefined || sortOrder === 0) {
    const supabase = getSupabaseAdmin();
    const { data: last } = await supabase
      .from('videos')
      .select('sort_order')
      .eq('chapter_id', input.chapter_id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();
    sortOrder = (Number(last?.sort_order) || 0) + 10;
  }

  const thumbnail =
    input.thumbnail_url?.trim() || youtubeThumbnailUrl(parsed.youtube_video_id);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('videos')
    .insert({
      course_id: input.course_id,
      chapter_id: input.chapter_id,
      title: input.title,
      description: input.description ?? '',
      youtube_url: parsed.youtube_url,
      youtube_video_id: parsed.youtube_video_id,
      video_type: input.video_type ?? 'recorded',
      thumbnail_url: thumbnail,
      duration_seconds: input.duration_seconds ?? 0,
      sort_order: sortOrder,
      is_free: input.is_free ?? false,
      is_published: input.is_published ?? true,
      updated_at: new Date().toISOString(),
    })
    .select(VIDEO_COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new AppError(
        409,
        'VIDEO_DUPLICATE',
        'This YouTube video is already assigned to that chapter',
      );
    }
    throw new AppError(400, 'VIDEO_CREATE_FAILED', error.message);
  }

  await syncChapterVideoCount(input.chapter_id);
  return toVideo(data as Record<string, unknown>, titles);
}

export async function updateVideo(
  videoId: string,
  input: UpdateVideoInput,
): Promise<Video> {
  const supabase = getSupabaseAdmin();
  const { data: existing, error: lookupError } = await supabase
    .from('videos')
    .select(VIDEO_COLUMNS)
    .eq('id', videoId)
    .maybeSingle();

  if (lookupError) {
    throw new AppError(500, 'VIDEO_FETCH_FAILED', lookupError.message);
  }
  if (!existing) {
    throw new AppError(404, 'VIDEO_NOT_FOUND', 'Video not found');
  }

  const courseId = input.course_id ?? (existing.course_id as string);
  const chapterId = input.chapter_id ?? (existing.chapter_id as string);
  const titles = await assertChapterBelongsToCourse(courseId, chapterId);

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.course_id !== undefined) patch.course_id = courseId;
  if (input.chapter_id !== undefined) patch.chapter_id = chapterId;
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.video_type !== undefined) patch.video_type = input.video_type;
  if (input.thumbnail_url !== undefined) patch.thumbnail_url = input.thumbnail_url;
  if (input.duration_seconds !== undefined) patch.duration_seconds = input.duration_seconds;
  if (input.sort_order !== undefined) patch.sort_order = input.sort_order;
  if (input.is_free !== undefined) patch.is_free = input.is_free;
  if (input.is_published !== undefined) patch.is_published = input.is_published;

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
    .from('videos')
    .update(patch)
    .eq('id', videoId)
    .select(VIDEO_COLUMNS)
    .maybeSingle();

  if (error) {
    if (error.code === '23505') {
      throw new AppError(
        409,
        'VIDEO_DUPLICATE',
        'This YouTube video is already assigned to that chapter',
      );
    }
    throw new AppError(400, 'VIDEO_UPDATE_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'VIDEO_NOT_FOUND', 'Video not found');
  }

  const oldChapter = existing.chapter_id as string;
  await syncChapterVideoCount(chapterId);
  if (oldChapter !== chapterId) {
    await syncChapterVideoCount(oldChapter);
  }

  return toVideo(data as Record<string, unknown>, titles);
}

export async function deleteVideo(videoId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: existing, error: lookupError } = await supabase
    .from('videos')
    .select('id, chapter_id')
    .eq('id', videoId)
    .maybeSingle();

  if (lookupError) {
    throw new AppError(500, 'VIDEO_FETCH_FAILED', lookupError.message);
  }
  if (!existing) {
    throw new AppError(404, 'VIDEO_NOT_FOUND', 'Video not found');
  }

  const { error } = await supabase.from('videos').delete().eq('id', videoId);
  if (error) {
    throw new AppError(400, 'VIDEO_DELETE_FAILED', error.message);
  }

  await syncChapterVideoCount(existing.chapter_id as string);
}

/**
 * Published videos for a chapter — hide YouTube URL when paid + not enrolled.
 */
export async function listVideosForChapterPublic(
  chapterId: string,
  options: { enrolled: boolean },
): Promise<VideoPublic[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('videos')
    .select(VIDEO_COLUMNS)
    .eq('chapter_id', chapterId)
    .eq('is_published', true)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new AppError(500, 'VIDEOS_FETCH_FAILED', error.message);
  }

  return ((data ?? []) as Record<string, unknown>[]).map((row) => {
    const isFree = Boolean(row.is_free);
    const is_locked = isMediaLocked(options.enrolled, isFree);
    return {
      id: row.id as string,
      course_id: row.course_id as string,
      chapter_id: row.chapter_id as string,
      title: row.title as string,
      description: (row.description as string) ?? '',
      video_type: row.video_type as VideoPublic['video_type'],
      thumbnail_url: (row.thumbnail_url as string | null) ?? null,
      duration_seconds: Number(row.duration_seconds) || 0,
      sort_order: Number(row.sort_order) || 0,
      is_free: isFree,
      is_locked,
      youtube_url: is_locked ? null : (row.youtube_url as string),
    };
  });
}
