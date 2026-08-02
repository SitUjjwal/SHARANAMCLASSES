/**
 * Video watch progress — Continue Watching (save position every ~15s).
 */
import type {
  ContinueWatchingItem,
  UpsertVideoWatchProgressInput,
  VideoWatchProgress,
} from '@sharanam/shared';

import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';

const RESUME_MIN_SECONDS = 5;
const COMPLETE_RATIO = 0.95;

function toProgress(row: Record<string, unknown>): VideoWatchProgress {
  return {
    video_id: row.video_id as string,
    course_id: row.course_id as string,
    chapter_id: row.chapter_id as string,
    position_seconds: Number(row.position_seconds) || 0,
    duration_seconds: Number(row.duration_seconds) || 0,
    completed: Boolean(row.completed),
    updated_at: row.updated_at as string,
  };
}

function isResumable(position: number, duration: number, completed: boolean): boolean {
  if (completed) return false;
  if (position < RESUME_MIN_SECONDS) return false;
  if (duration > 0 && position >= duration * COMPLETE_RATIO) return false;
  return true;
}

/**
 * upsertVideoWatchProgress
 * Upserts playback position; marks completed near the end; nudges enrollment last-watched.
 */
export async function upsertVideoWatchProgress(
  userId: string,
  videoId: string,
  input: UpsertVideoWatchProgressInput,
): Promise<VideoWatchProgress> {
  const supabase = getSupabaseAdmin();

  const { data: video, error: videoError } = await supabase
    .from('videos')
    .select('id, course_id, chapter_id, duration_seconds, is_published')
    .eq('id', videoId)
    .maybeSingle();

  if (videoError) {
    throw new AppError(500, 'VIDEO_LOOKUP_FAILED', videoError.message);
  }
  if (!video || !video.is_published) {
    throw new AppError(404, 'VIDEO_NOT_FOUND', 'Video not found');
  }
  if (video.course_id !== input.course_id || video.chapter_id !== input.chapter_id) {
    throw new AppError(400, 'VIDEO_CONTEXT_MISMATCH', 'Video does not match course/chapter');
  }

  const position = Math.max(0, Number(input.position_seconds) || 0);
  const duration = Math.max(
    0,
    Number(input.duration_seconds) || Number(video.duration_seconds) || 0,
  );
  const completed = duration > 0 ? position >= duration * COMPLETE_RATIO : false;

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('video_watch_progress')
    .upsert(
      {
        user_id: userId,
        video_id: videoId,
        course_id: input.course_id,
        chapter_id: input.chapter_id,
        position_seconds: completed ? duration : position,
        duration_seconds: duration,
        completed,
        updated_at: now,
      },
      { onConflict: 'user_id,video_id' },
    )
    .select(
      'video_id, course_id, chapter_id, position_seconds, duration_seconds, completed, updated_at',
    )
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'WATCH_PROGRESS_SAVE_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(500, 'WATCH_PROGRESS_SAVE_FAILED', 'Progress was not saved');
  }

  // Keep My Courses / Learning Progress "last watched" in sync
  await supabase
    .from('enrollments')
    .update({
      last_watched_chapter_id: input.chapter_id,
      last_watched_at: now,
    })
    .eq('user_id', userId)
    .eq('course_id', input.course_id);

  return toProgress(data as Record<string, unknown>);
}

export async function getVideoWatchProgress(
  userId: string,
  videoId: string,
): Promise<VideoWatchProgress | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('video_watch_progress')
    .select(
      'video_id, course_id, chapter_id, position_seconds, duration_seconds, completed, updated_at',
    )
    .eq('user_id', userId)
    .eq('video_id', videoId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'WATCH_PROGRESS_FETCH_FAILED', error.message);
  }
  if (!data) return null;
  return toProgress(data as Record<string, unknown>);
}

/**
 * getContinueWatchingForUser
 * Most recently updated in-progress video (position ≥ 5s, not near end).
 */
export async function getContinueWatchingForUser(
  userId: string,
): Promise<ContinueWatchingItem | null> {
  const supabase = getSupabaseAdmin();

  const { data: rows, error } = await supabase
    .from('video_watch_progress')
    .select(
      'video_id, course_id, chapter_id, position_seconds, duration_seconds, completed, updated_at',
    )
    .eq('user_id', userId)
    .eq('completed', false)
    .gte('position_seconds', RESUME_MIN_SECONDS)
    .order('updated_at', { ascending: false })
    .limit(15);

  if (error) {
    throw new AppError(500, 'CONTINUE_WATCHING_FAILED', error.message);
  }

  const candidate = (rows ?? []).find((row) =>
    isResumable(
      Number(row.position_seconds) || 0,
      Number(row.duration_seconds) || 0,
      Boolean(row.completed),
    ),
  );

  if (!candidate) return null;

  const videoId = candidate.video_id as string;
  const courseId = candidate.course_id as string;
  const chapterId = candidate.chapter_id as string;
  const position = Number(candidate.position_seconds) || 0;
  const duration = Number(candidate.duration_seconds) || 0;

  const [{ data: video }, { data: course }, { data: chapter }] = await Promise.all([
    supabase
      .from('videos')
      .select('id, title, thumbnail_url, youtube_video_id, is_published')
      .eq('id', videoId)
      .maybeSingle(),
    supabase.from('courses').select('id, title').eq('id', courseId).maybeSingle(),
    supabase.from('chapters').select('id, title').eq('id', chapterId).maybeSingle(),
  ]);

  if (!video || !video.is_published) return null;

  const progress_percent =
    duration > 0 ? Math.min(99, Math.round((100 * position) / duration)) : 0;

  return {
    video_id: videoId,
    course_id: courseId,
    chapter_id: chapterId,
    video_title: (video.title as string) || 'Video',
    course_title: (course?.title as string) || 'Course',
    chapter_title: (chapter?.title as string) || 'Chapter',
    thumbnail_url: (video.thumbnail_url as string | null) ?? null,
    position_seconds: position,
    duration_seconds: duration,
    progress_percent,
    updated_at: candidate.updated_at as string,
  };
}
