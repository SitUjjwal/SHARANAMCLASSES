/**
 * Chapter catalog + content (with lock based on enrollment / free preview).
 */
import { getSupabaseAdmin } from '../config/supabase';
import { emitChapterPublished } from '../events';
import { AppError } from '../utils/AppError';
import type { Chapter, ChapterContentItem, ChapterDetail } from '@sharanam/shared';
import type {
  CreateChapterInput,
  UpdateChapterInput,
} from '../validators/course.validators';
import { listVideosForChapterPublic } from './video.service';
import { listPdfsForChapterPublic } from './pdf.service';
import { listNotesForChapterPublic } from './note.service';
import { listLiveClassesPublic } from './liveClass.service';
import {
  userHasCourseAccess,
  type CourseAccessContext,
} from './courseAccess.service';

const CHAPTER_COLUMNS =
  'id, course_id, title, description, sort_order, duration_seconds, video_count, pdf_count, notes_count, video_url, is_free_preview, is_published';

const CONTENT_COLUMNS =
  'id, chapter_id, content_type, title, url, body, duration_seconds, sort_order';

type ChapterRow = {
  id: string;
  course_id: string;
  title: string;
  description: string;
  sort_order: number;
  duration_seconds: number | null;
  video_count: number | null;
  pdf_count: number | null;
  notes_count: number | null;
  video_url: string | null;
  is_free_preview: boolean;
  is_published: boolean;
};

async function isUserEnrolled(userId: string, courseId: string): Promise<boolean> {
  return userHasCourseAccess(userId, courseId);
}

function toChapter(
  row: ChapterRow,
  chapterNumber: number,
  unlocked: boolean,
): Chapter {
  const isLocked = !(unlocked || row.is_free_preview);
  return {
    id: row.id,
    course_id: row.course_id,
    title: row.title,
    description: row.description,
    sort_order: row.sort_order,
    chapter_number: chapterNumber,
    duration_seconds: Number(row.duration_seconds) || 0,
    video_count: Number(row.video_count) || 0,
    pdf_count: Number(row.pdf_count) || 0,
    notes_count: Number(row.notes_count) || 0,
    is_locked: isLocked,
    video_url: row.video_url,
    is_free_preview: row.is_free_preview,
    is_published: row.is_published,
  };
}

export async function listChaptersForCourse(
  courseId: string,
  options: { publishedOnly: boolean; userId?: string; search?: string },
): Promise<Chapter[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('chapters')
    .select(CHAPTER_COLUMNS)
    .eq('course_id', courseId)
    .order('sort_order', { ascending: true });

  if (options.publishedOnly) {
    query = query.eq('is_published', true);
  }

  const search = options.search?.trim();
  if (search) {
    const safe = search.replace(/[%_,.()]/g, '');
    if (safe) {
      query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`);
    }
  }

  const { data, error } = await query;
  if (error) {
    throw new AppError(500, 'CHAPTERS_FETCH_FAILED', error.message);
  }

  const unlocked = options.userId
    ? await isUserEnrolled(options.userId, courseId)
    : false;

  return ((data ?? []) as ChapterRow[]).map((row, index) =>
    toChapter(row, index + 1, unlocked),
  );
}

/** Admin syllabus list — includes unpublished chapters */
export async function listChaptersForAdmin(
  courseId: string,
  search?: string,
): Promise<Chapter[]> {
  // Admin always treats chapters as unlocked for display of counts/meta
  return listChaptersForCourse(courseId, {
    publishedOnly: false,
    search,
  }).then((chapters) =>
    chapters.map((chapter) => ({
      ...chapter,
      is_locked: false,
    })),
  );
}

/**
 * Persist drag-and-drop order. `orderedIds` must be the full set for the course.
 */
export async function reorderChapters(
  courseId: string,
  orderedIds: string[],
): Promise<Chapter[]> {
  const supabase = getSupabaseAdmin();

  const { data: existing, error: listError } = await supabase
    .from('chapters')
    .select('id')
    .eq('course_id', courseId);

  if (listError) {
    throw new AppError(500, 'CHAPTERS_FETCH_FAILED', listError.message);
  }

  const existingIds = new Set((existing ?? []).map((row) => row.id as string));
  if (existingIds.size !== orderedIds.length) {
    throw new AppError(
      400,
      'CHAPTER_REORDER_MISMATCH',
      'orderedIds must include every chapter for this course exactly once',
    );
  }
  for (const id of orderedIds) {
    if (!existingIds.has(id)) {
      throw new AppError(400, 'CHAPTER_REORDER_INVALID', `Unknown chapter id: ${id}`);
    }
  }

  const now = new Date().toISOString();
  // 10, 20, 30… keeps room for manual inserts later
  const updates = orderedIds.map((id, index) =>
    supabase
      .from('chapters')
      .update({ sort_order: (index + 1) * 10, updated_at: now })
      .eq('id', id)
      .eq('course_id', courseId),
  );

  const results = await Promise.all(updates);
  const firstError = results.find((result) => result.error)?.error;
  if (firstError) {
    throw new AppError(400, 'CHAPTER_REORDER_FAILED', firstError.message);
  }

  return listChaptersForAdmin(courseId);
}

export async function getChapterDetail(
  courseId: string,
  chapterId: string,
  userId: string,
): Promise<ChapterDetail> {
  const supabase = getSupabaseAdmin();

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title, is_published')
    .eq('id', courseId)
    .eq('is_published', true)
    .maybeSingle();

  if (courseError) {
    throw new AppError(500, 'COURSE_FETCH_FAILED', courseError.message);
  }
  if (!course) {
    throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found');
  }

  const { data: rows, error: listError } = await supabase
    .from('chapters')
    .select(CHAPTER_COLUMNS)
    .eq('course_id', courseId)
    .eq('is_published', true)
    .order('sort_order', { ascending: true });

  if (listError) {
    throw new AppError(500, 'CHAPTERS_FETCH_FAILED', listError.message);
  }

  const chapterRows = (rows ?? []) as ChapterRow[];
  const index = chapterRows.findIndex((row) => row.id === chapterId);
  if (index < 0) {
    throw new AppError(404, 'CHAPTER_NOT_FOUND', 'Chapter not found');
  }

  const unlocked = await isUserEnrolled(userId, courseId);
  const chapterRow = chapterRows[index];
  if (!chapterRow) {
    throw new AppError(404, 'CHAPTER_NOT_FOUND', 'Chapter not found');
  }
  const chapter = toChapter(chapterRow, index + 1, unlocked);

  // Always load catalogs so free-preview rows appear with lock / free badges
  const [videos, pdfs, notes, liveClasses] = await Promise.all([
    listVideosForChapterPublic(chapterId, { enrolled: unlocked }),
    listPdfsForChapterPublic(chapterId, { enrolled: unlocked }),
    listNotesForChapterPublic(chapterId, { enrolled: unlocked }),
    listLiveClassesPublic({ courseId }),
  ]);

  const videoAsContents: ChapterContentItem[] = videos.map((video) => ({
    id: video.id,
    chapter_id: video.chapter_id,
    content_type: 'video' as const,
    title: video.title,
    url: video.youtube_url,
    body: video.is_locked ? 'Locked — enroll to watch' : null,
    duration_seconds: video.duration_seconds,
    sort_order: video.sort_order,
  }));

  const pdfAsContents: ChapterContentItem[] = pdfs.map((pdf) => ({
    id: pdf.id,
    chapter_id: pdf.chapter_id,
    content_type: 'pdf' as const,
    title: pdf.title,
    url: pdf.file_url,
    body: pdf.is_locked ? 'Locked — enroll to open' : null,
    duration_seconds: null,
    sort_order: pdf.sort_order,
  }));

  const noteAsContents: ChapterContentItem[] = notes.map((note) => ({
    id: note.id,
    chapter_id: note.chapter_id,
    content_type: 'note' as const,
    title: note.title,
    url: note.notes_url,
    body: note.is_locked
      ? 'Locked — enroll to open'
      : note.description || null,
    duration_seconds: null,
    sort_order: note.sort_order,
  }));

  let items: ChapterContentItem[] = [];

  if (!chapter.is_locked) {
    const { data: contents, error: contentsError } = await supabase
      .from('chapter_contents')
      .select(CONTENT_COLUMNS)
      .eq('chapter_id', chapterId)
      .order('sort_order', { ascending: true });

    if (contentsError) {
      throw new AppError(500, 'CHAPTER_CONTENTS_FETCH_FAILED', contentsError.message);
    }

    items = ((contents ?? []) as ChapterContentItem[]).filter((item) => {
      if (item.content_type === 'video' || item.content_type === 'pdf') return false;
      if (item.content_type === 'note' && notes.length > 0) return false;
      return true;
    });

    if (
      !videoAsContents.length &&
      !items.some((i) => i.content_type === 'video') &&
      chapter.video_url
    ) {
      items = [
        {
          id: `${chapter.id}-legacy-video`,
          chapter_id: chapter.id,
          content_type: 'video',
          title: chapter.title,
          url: chapter.video_url,
          body: null,
          duration_seconds: chapter.duration_seconds || null,
          sort_order: 0,
        },
        ...items,
      ];
    }
  }

  items = [...videoAsContents, ...pdfAsContents, ...noteAsContents, ...items].sort(
    (a, b) => (a.sort_order || 0) - (b.sort_order || 0),
  );

  // Prefer active / upcoming lives on the chapter syllabus
  const live_classes = liveClasses.filter((live) => live.status !== 'ended');

  return {
    ...chapter,
    course_title: course.title as string,
    contents: items,
    videos,
    pdfs,
    notes,
    live_classes,
  };
}

export async function createChapter(
  courseId: string,
  input: CreateChapterInput,
): Promise<Chapter> {
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

  let sortOrder = input.sort_order;
  if (sortOrder === undefined || sortOrder === 0) {
    const { data: last } = await supabase
      .from('chapters')
      .select('sort_order')
      .eq('course_id', courseId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();
    sortOrder = (Number(last?.sort_order) || 0) + 10;
  }

  const { data, error } = await supabase
    .from('chapters')
    .insert({
      course_id: courseId,
      ...input,
      sort_order: sortOrder,
      updated_at: new Date().toISOString(),
    })
    .select(CHAPTER_COLUMNS)
    .single();

  if (error) {
    throw new AppError(400, 'CHAPTER_CREATE_FAILED', error.message);
  }

  const chapter = toChapter(data as ChapterRow, 1, true);
  if (chapter.is_published) {
    emitChapterPublished({
      chapter_id: chapter.id,
      course_id: courseId,
      title: chapter.title,
      course_title: String(course.title ?? 'your course'),
    });
  }
  return chapter;
}

export async function updateChapter(
  chapterId: string,
  input: UpdateChapterInput,
): Promise<Chapter> {
  const supabase = getSupabaseAdmin();

  const { data: existing, error: existingError } = await supabase
    .from('chapters')
    .select('id, course_id, title, is_published')
    .eq('id', chapterId)
    .maybeSingle();

  if (existingError) {
    throw new AppError(500, 'CHAPTER_LOOKUP_FAILED', existingError.message);
  }
  if (!existing) {
    throw new AppError(404, 'CHAPTER_NOT_FOUND', 'Chapter not found');
  }

  const { data, error } = await supabase
    .from('chapters')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', chapterId)
    .select(CHAPTER_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new AppError(400, 'CHAPTER_UPDATE_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'CHAPTER_NOT_FOUND', 'Chapter not found');
  }

  const chapter = toChapter(data as ChapterRow, 1, true);
  const wasPublished = Boolean(existing.is_published);
  if (chapter.is_published && !wasPublished) {
    const { data: course } = await supabase
      .from('courses')
      .select('title')
      .eq('id', chapter.course_id)
      .maybeSingle();
    emitChapterPublished({
      chapter_id: chapter.id,
      course_id: chapter.course_id,
      title: chapter.title,
      course_title: String(course?.title ?? 'your course'),
    });
  }
  return chapter;
}

export async function deleteChapter(chapterId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error, count } = await supabase
    .from('chapters')
    .delete({ count: 'exact' })
    .eq('id', chapterId);

  if (error) {
    throw new AppError(400, 'CHAPTER_DELETE_FAILED', error.message);
  }
  if (!count) {
    throw new AppError(404, 'CHAPTER_NOT_FOUND', 'Chapter not found');
  }
}

async function assertChapterExists(chapterId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('chapters')
    .select('id')
    .eq('id', chapterId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'CHAPTER_LOOKUP_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'CHAPTER_NOT_FOUND', 'Chapter not found');
  }
}

function toContentItem(row: Record<string, unknown>): ChapterContentItem {
  return {
    id: row.id as string,
    chapter_id: row.chapter_id as string,
    content_type: row.content_type as ChapterContentItem['content_type'],
    title: row.title as string,
    url: (row.url as string | null) ?? null,
    body: (row.body as string | null) ?? null,
    duration_seconds:
      row.duration_seconds === null || row.duration_seconds === undefined
        ? null
        : Number(row.duration_seconds),
    sort_order: Number(row.sort_order) || 0,
  };
}

/** Recount video/pdf/note totals + total duration on the chapter row */
async function syncChapterContentMeta(chapterId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('chapter_contents')
    .select('content_type, duration_seconds')
    .eq('chapter_id', chapterId);

  if (error) {
    throw new AppError(500, 'CHAPTER_CONTENTS_FETCH_FAILED', error.message);
  }

  const rows = data ?? [];
  const video_count = rows.filter((r) => r.content_type === 'video').length;
  const pdf_count = rows.filter((r) => r.content_type === 'pdf').length;
  const notes_count = rows.filter((r) => r.content_type === 'note').length;
  const duration_seconds = rows.reduce(
    (sum, r) => sum + (Number(r.duration_seconds) || 0),
    0,
  );

  const { error: updateError } = await supabase
    .from('chapters')
    .update({
      video_count,
      pdf_count,
      notes_count,
      duration_seconds,
      updated_at: new Date().toISOString(),
    })
    .eq('id', chapterId);

  if (updateError) {
    throw new AppError(500, 'CHAPTER_META_SYNC_FAILED', updateError.message);
  }
}

export async function listChapterContents(
  chapterId: string,
): Promise<ChapterContentItem[]> {
  await assertChapterExists(chapterId);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('chapter_contents')
    .select(CONTENT_COLUMNS)
    .eq('chapter_id', chapterId)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new AppError(500, 'CHAPTER_CONTENTS_FETCH_FAILED', error.message);
  }

  return ((data ?? []) as Record<string, unknown>[]).map(toContentItem);
}

export async function createChapterContent(
  chapterId: string,
  input: import('../validators/course.validators').CreateChapterContentInput,
): Promise<ChapterContentItem> {
  await assertChapterExists(chapterId);
  const supabase = getSupabaseAdmin();

  let sortOrder = input.sort_order;
  if (sortOrder === undefined || sortOrder === 0) {
    const { data: last } = await supabase
      .from('chapter_contents')
      .select('sort_order')
      .eq('chapter_id', chapterId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();
    sortOrder = (Number(last?.sort_order) || 0) + 10;
  }

  const { data, error } = await supabase
    .from('chapter_contents')
    .insert({
      chapter_id: chapterId,
      content_type: input.content_type,
      title: input.title,
      url: input.url ?? null,
      body: input.body ?? null,
      duration_seconds: input.duration_seconds ?? null,
      sort_order: sortOrder,
    })
    .select(CONTENT_COLUMNS)
    .single();

  if (error) {
    throw new AppError(400, 'CHAPTER_CONTENT_CREATE_FAILED', error.message);
  }

  await syncChapterContentMeta(chapterId);
  return toContentItem(data as Record<string, unknown>);
}

export async function updateChapterContent(
  contentId: string,
  input: import('../validators/course.validators').UpdateChapterContentInput,
): Promise<ChapterContentItem> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('chapter_contents')
    .update({
      ...input,
    })
    .eq('id', contentId)
    .select(CONTENT_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new AppError(400, 'CHAPTER_CONTENT_UPDATE_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'CHAPTER_CONTENT_NOT_FOUND', 'Content not found');
  }

  await syncChapterContentMeta(data.chapter_id as string);
  return toContentItem(data as Record<string, unknown>);
}

export async function deleteChapterContent(contentId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: existing, error: lookupError } = await supabase
    .from('chapter_contents')
    .select('id, chapter_id')
    .eq('id', contentId)
    .maybeSingle();

  if (lookupError) {
    throw new AppError(500, 'CHAPTER_CONTENTS_FETCH_FAILED', lookupError.message);
  }
  if (!existing) {
    throw new AppError(404, 'CHAPTER_CONTENT_NOT_FOUND', 'Content not found');
  }

  const { error } = await supabase.from('chapter_contents').delete().eq('id', contentId);
  if (error) {
    throw new AppError(400, 'CHAPTER_CONTENT_DELETE_FAILED', error.message);
  }

  await syncChapterContentMeta(existing.chapter_id as string);
}

/**
 * Resolve a published chapter for a student and enrollment on its course.
 */
async function resolveChapterAccess(
  chapterId: string,
  userId: string,
): Promise<{ courseId: string; enrolled: boolean }> {
  const supabase = getSupabaseAdmin();

  const { data: chapter, error } = await supabase
    .from('chapters')
    .select('id, course_id, is_published')
    .eq('id', chapterId)
    .eq('is_published', true)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'CHAPTER_FETCH_FAILED', error.message);
  }
  if (!chapter) {
    throw new AppError(404, 'CHAPTER_NOT_FOUND', 'Chapter not found');
  }

  const courseId = chapter.course_id as string;

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id')
    .eq('id', courseId)
    .eq('is_published', true)
    .maybeSingle();

  if (courseError) {
    throw new AppError(500, 'COURSE_FETCH_FAILED', courseError.message);
  }
  if (!course) {
    throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found');
  }

  const enrolled = await isUserEnrolled(userId, courseId);
  return { courseId, enrolled };
}

/** GET /chapters/:chapterId/videos — prefer middleware access context */
export async function listChapterVideosForStudent(
  chapterId: string,
  accessOrUserId: CourseAccessContext | string,
) {
  const enrolled =
    typeof accessOrUserId === 'string'
      ? (await resolveChapterAccess(chapterId, accessOrUserId)).enrolled
      : accessOrUserId.hasFullAccess;
  return listVideosForChapterPublic(chapterId, { enrolled });
}

/** GET /chapters/:chapterId/pdfs */
export async function listChapterPdfsForStudent(
  chapterId: string,
  accessOrUserId: CourseAccessContext | string,
) {
  const enrolled =
    typeof accessOrUserId === 'string'
      ? (await resolveChapterAccess(chapterId, accessOrUserId)).enrolled
      : accessOrUserId.hasFullAccess;
  return listPdfsForChapterPublic(chapterId, { enrolled });
}

/** GET /chapters/:chapterId/notes */
export async function listChapterNotesForStudent(
  chapterId: string,
  accessOrUserId: CourseAccessContext | string,
) {
  const enrolled =
    typeof accessOrUserId === 'string'
      ? (await resolveChapterAccess(chapterId, accessOrUserId)).enrolled
      : accessOrUserId.hasFullAccess;
  return listNotesForChapterPublic(chapterId, { enrolled });
}

/**
 * GET /courses/:courseId/content — all chapters with videos/pdfs/notes + live classes.
 * Pass CourseAccessContext from middleware to avoid a second purchase check.
 */
export async function getCourseContent(
  courseId: string,
  accessOrUserId: CourseAccessContext | string,
) {
  const supabase = getSupabaseAdmin();
  const userId =
    typeof accessOrUserId === 'string' ? accessOrUserId : accessOrUserId.userId;
  const enrolled =
    typeof accessOrUserId === 'string'
      ? await isUserEnrolled(userId, courseId)
      : accessOrUserId.hasFullAccess;

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title, is_published')
    .eq('id', courseId)
    .eq('is_published', true)
    .maybeSingle();

  if (courseError) {
    throw new AppError(500, 'COURSE_FETCH_FAILED', courseError.message);
  }
  if (!course) {
    throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found');
  }

  const chapters = await listChaptersForCourse(courseId, {
    publishedOnly: true,
    userId,
  });

  const chaptersWithContent = await Promise.all(
    chapters.map(async (chapter) => {
      const [videos, pdfs, notes] = await Promise.all([
        listVideosForChapterPublic(chapter.id, { enrolled }),
        listPdfsForChapterPublic(chapter.id, { enrolled }),
        listNotesForChapterPublic(chapter.id, { enrolled }),
      ]);
      return { ...chapter, videos, pdfs, notes };
    }),
  );

  const live_classes = await listLiveClassesPublic({ courseId });

  return {
    course_id: course.id as string,
    course_title: course.title as string,
    enrolled,
    access_mode: enrolled ? ('full' as const) : ('preview' as const),
    chapters: chaptersWithContent,
    live_classes,
  };
}
