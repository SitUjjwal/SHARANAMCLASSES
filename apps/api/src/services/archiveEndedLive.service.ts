/**
 * When a live class ends, store its YouTube link on the related course
 * as a published video under a "Live Recordings" chapter, then drop it
 * from the student Live feed (via end_time filter + archived_video_id).
 */
import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import { createChapter } from './chapter.service';
import { createVideo } from './video.service';

const LIVE_RECORDINGS_TITLE = 'Live Recordings';

function isEnded(startTime: string, endTime: string, nowMs = Date.now()): boolean {
  const start = Date.parse(startTime);
  const end = Date.parse(endTime);
  if (Number.isNaN(start) || Number.isNaN(end)) return true;
  return nowMs > end;
}

async function ensureLiveRecordingsChapter(courseId: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data: existing, error } = await supabase
    .from('chapters')
    .select('id, title')
    .eq('course_id', courseId)
    .ilike('title', LIVE_RECORDINGS_TITLE)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'CHAPTER_LOOKUP_FAILED', error.message);
  }
  if (existing?.id) {
    return existing.id as string;
  }

  const chapter = await createChapter(courseId, {
    title: LIVE_RECORDINGS_TITLE,
    description: 'Recordings from ended live classes.',
    sort_order: 9990,
    is_published: true,
    is_free_preview: false,
    duration_seconds: 0,
    video_count: 0,
    pdf_count: 0,
    notes_count: 0,
  });
  return chapter.id;
}

async function findExistingVideoId(
  chapterId: string,
  youtubeVideoId: string,
): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('videos')
    .select('id')
    .eq('chapter_id', chapterId)
    .eq('youtube_video_id', youtubeVideoId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'VIDEO_LOOKUP_FAILED', error.message);
  }
  return (data?.id as string | undefined) ?? null;
}

/**
 * Archive one ended live class onto its course (idempotent).
 * @returns video id when archived (or already archived), null if skipped.
 */
export async function archiveLiveClassToCourse(liveClassId: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data: row, error } = await supabase
    .from('live_classes')
    .select(
      'id, course_id, title, description, youtube_url, youtube_video_id, thumbnail_url, start_time, end_time, archived_video_id, is_published',
    )
    .eq('id', liveClassId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'LIVE_CLASS_FETCH_FAILED', error.message);
  }
  if (!row) return null;

  if (row.archived_video_id) {
    return row.archived_video_id as string;
  }

  const courseId = row.course_id as string | null;
  if (!courseId) return null;

  if (!isEnded(row.start_time as string, row.end_time as string)) {
    return null;
  }

  const chapterId = await ensureLiveRecordingsChapter(courseId);
  let videoId = await findExistingVideoId(chapterId, row.youtube_video_id as string);

  if (!videoId) {
    try {
      const video = await createVideo({
        course_id: courseId,
        chapter_id: chapterId,
        title: row.title as string,
        description:
          ((row.description as string) || '').trim() ||
          'Recording from live class.',
        youtube_url: row.youtube_url as string,
        video_type: 'live',
        thumbnail_url: (row.thumbnail_url as string | null) ?? null,
        is_published: true,
        is_free: false,
        sort_order: 0,
        duration_seconds: 0,
      });
      videoId = video.id;
    } catch (err) {
      if (err instanceof AppError && err.code === 'VIDEO_DUPLICATE') {
        videoId = await findExistingVideoId(chapterId, row.youtube_video_id as string);
      } else {
        throw err;
      }
    }
  }

  if (!videoId) return null;

  const { error: updateError } = await supabase
    .from('live_classes')
    .update({
      archived_video_id: videoId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', liveClassId)
    .is('archived_video_id', null);

  if (updateError) {
    throw new AppError(500, 'LIVE_CLASS_ARCHIVE_FAILED', updateError.message);
  }

  return videoId;
}

/** Batch-archive recently ended lives that still need a course video. */
export async function archiveEndedLiveClasses(limit = 25): Promise<{
  scanned: number;
  archived: number;
  skipped: number;
  errors: string[];
}> {
  const supabase = getSupabaseAdmin();
  const nowIso = new Date().toISOString();
  const lookback = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('live_classes')
    .select('id')
    .eq('is_published', true)
    .not('course_id', 'is', null)
    .is('archived_video_id', null)
    .lte('end_time', nowIso)
    .gte('end_time', lookback)
    .order('end_time', { ascending: false })
    .limit(limit);

  if (error) {
    return { scanned: 0, archived: 0, skipped: 0, errors: [error.message] };
  }

  const rows = data ?? [];
  let archived = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const videoId = await archiveLiveClassToCourse(row.id as string);
      if (videoId) archived += 1;
      else skipped += 1;
    } catch (err) {
      errors.push(
        `${row.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return { scanned: rows.length, archived, skipped, errors };
}
