/**
 * Notes catalog — HTTPS URL only in PostgreSQL; admin CRUD + student public list.
 */
import type { Note, NotePublic } from '@sharanam/shared';

import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import { parseSafeNotesUrl } from '../utils/notesUrl';
import type {
  CreateNoteInput,
  ListNotesQuery,
  UpdateNoteInput,
} from '../validators/note.validators';

const NOTE_COLUMNS =
  'id, course_id, chapter_id, title, description, notes_url, sort_order, is_free, is_published, created_at, updated_at';

export type NoteListPage = {
  items: Note[];
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

async function syncChapterNotesCount(chapterId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from('notes')
    .select('id', { count: 'exact', head: true })
    .eq('chapter_id', chapterId)
    .eq('is_published', true);

  if (error) {
    throw new AppError(500, 'NOTES_COUNT_SYNC_FAILED', error.message);
  }

  const { data: contents } = await supabase
    .from('chapter_contents')
    .select('id')
    .eq('chapter_id', chapterId)
    .eq('content_type', 'note');

  const legacy = contents?.length ?? 0;
  const notes_count = (count ?? 0) + legacy;

  const { error: updateError } = await supabase
    .from('chapters')
    .update({
      notes_count,
      updated_at: new Date().toISOString(),
    })
    .eq('id', chapterId);

  if (updateError) {
    throw new AppError(500, 'CHAPTER_META_SYNC_FAILED', updateError.message);
  }
}

function requireSafeUrl(raw: string): string {
  const parsed = parseSafeNotesUrl(raw);
  if (!parsed) {
    throw new AppError(
      400,
      'INVALID_NOTES_URL',
      'Notes URL must be a valid public HTTPS link (no http, javascript, or private hosts).',
    );
  }
  return parsed;
}

function toNote(
  row: Record<string, unknown>,
  titles?: { course_title?: string | null; chapter_title?: string | null },
): Note {
  return {
    id: row.id as string,
    course_id: row.course_id as string,
    chapter_id: row.chapter_id as string,
    title: row.title as string,
    description: (row.description as string) ?? '',
    notes_url: row.notes_url as string,
    sort_order: Number(row.sort_order) || 0,
    is_free: Boolean(row.is_free),
    is_published: Boolean(row.is_published),
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
    course_title: titles?.course_title ?? null,
    chapter_title: titles?.chapter_title ?? null,
  };
}

export async function listNotesForAdmin(filters: ListNotesQuery): Promise<NoteListPage> {
  const supabase = getSupabaseAdmin();
  const page = filters.page;
  const pageSize = filters.pageSize;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('notes')
    .select(NOTE_COLUMNS, { count: 'exact' })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filters.courseId) query = query.eq('course_id', filters.courseId);
  if (filters.chapterId) query = query.eq('chapter_id', filters.chapterId);
  if (filters.access === 'free') query = query.eq('is_free', true);
  else if (filters.access === 'paid') query = query.eq('is_free', false);
  if (filters.status === 'published') query = query.eq('is_published', true);
  else if (filters.status === 'draft') query = query.eq('is_published', false);

  const search = filters.search?.trim();
  if (search) {
    const safe = search.replace(/[%_,.()]/g, '');
    if (safe) {
      query = query.or(
        `title.ilike.%${safe}%,description.ilike.%${safe}%,notes_url.ilike.%${safe}%`,
      );
    }
  }

  const { data, error, count } = await query;
  if (error) {
    throw new AppError(500, 'NOTES_FETCH_FAILED', error.message);
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
    toNote(row, {
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

export async function getNoteForAdmin(noteId: string): Promise<Note> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('notes')
    .select(NOTE_COLUMNS)
    .eq('id', noteId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'NOTE_FETCH_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'NOTE_NOT_FOUND', 'Note not found');
  }

  const titles = await assertChapterBelongsToCourse(
    data.course_id as string,
    data.chapter_id as string,
  );
  return toNote(data as Record<string, unknown>, titles);
}

export async function createNote(input: CreateNoteInput): Promise<Note> {
  const titles = await assertChapterBelongsToCourse(input.course_id, input.chapter_id);
  const notes_url = requireSafeUrl(input.notes_url);

  let sortOrder = input.sort_order;
  if (sortOrder === undefined || sortOrder === 0) {
    const supabase = getSupabaseAdmin();
    const { data: last } = await supabase
      .from('notes')
      .select('sort_order')
      .eq('chapter_id', input.chapter_id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();
    sortOrder = (Number(last?.sort_order) || 0) + 10;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('notes')
    .insert({
      course_id: input.course_id,
      chapter_id: input.chapter_id,
      title: input.title,
      description: input.description ?? '',
      notes_url,
      sort_order: sortOrder,
      is_free: input.is_free ?? false,
      is_published: input.is_published ?? true,
      updated_at: new Date().toISOString(),
    })
    .select(NOTE_COLUMNS)
    .single();

  if (error) {
    throw new AppError(400, 'NOTE_CREATE_FAILED', error.message);
  }

  await syncChapterNotesCount(input.chapter_id);
  return toNote(data as Record<string, unknown>, titles);
}

export async function updateNote(noteId: string, input: UpdateNoteInput): Promise<Note> {
  const supabase = getSupabaseAdmin();
  const { data: existing, error: lookupError } = await supabase
    .from('notes')
    .select(NOTE_COLUMNS)
    .eq('id', noteId)
    .maybeSingle();

  if (lookupError) {
    throw new AppError(500, 'NOTE_FETCH_FAILED', lookupError.message);
  }
  if (!existing) {
    throw new AppError(404, 'NOTE_NOT_FOUND', 'Note not found');
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
  if (input.sort_order !== undefined) patch.sort_order = input.sort_order;
  if (input.is_free !== undefined) patch.is_free = input.is_free;
  if (input.is_published !== undefined) patch.is_published = input.is_published;
  if (input.notes_url !== undefined) patch.notes_url = requireSafeUrl(input.notes_url);

  const { data, error } = await supabase
    .from('notes')
    .update(patch)
    .eq('id', noteId)
    .select(NOTE_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new AppError(400, 'NOTE_UPDATE_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'NOTE_NOT_FOUND', 'Note not found');
  }

  const oldChapter = existing.chapter_id as string;
  await syncChapterNotesCount(chapterId);
  if (oldChapter !== chapterId) {
    await syncChapterNotesCount(oldChapter);
  }

  return toNote(data as Record<string, unknown>, titles);
}

export async function deleteNote(noteId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: existing, error: lookupError } = await supabase
    .from('notes')
    .select('id, chapter_id')
    .eq('id', noteId)
    .maybeSingle();

  if (lookupError) {
    throw new AppError(500, 'NOTE_FETCH_FAILED', lookupError.message);
  }
  if (!existing) {
    throw new AppError(404, 'NOTE_NOT_FOUND', 'Note not found');
  }

  const { error } = await supabase.from('notes').delete().eq('id', noteId);
  if (error) {
    throw new AppError(400, 'NOTE_DELETE_FAILED', error.message);
  }

  await syncChapterNotesCount(existing.chapter_id as string);
}

/**
 * Published notes for a chapter — hide URL when paid + not enrolled.
 */
export async function listNotesForChapterPublic(
  chapterId: string,
  options: { enrolled: boolean },
): Promise<NotePublic[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('notes')
    .select(NOTE_COLUMNS)
    .eq('chapter_id', chapterId)
    .eq('is_published', true)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new AppError(500, 'NOTES_FETCH_FAILED', error.message);
  }

  return ((data ?? []) as Record<string, unknown>[]).map((row) => {
    const isFree = Boolean(row.is_free);
    const is_locked = !options.enrolled && !isFree;
    return {
      id: row.id as string,
      course_id: row.course_id as string,
      chapter_id: row.chapter_id as string,
      title: row.title as string,
      description: (row.description as string) ?? '',
      sort_order: Number(row.sort_order) || 0,
      is_free: isFree,
      is_locked,
      notes_url: is_locked ? null : (row.notes_url as string),
    };
  });
}
