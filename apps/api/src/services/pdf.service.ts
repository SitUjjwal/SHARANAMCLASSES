/**
 * PDF catalog — file binary in Cloudflare R2; URL + metadata in PostgreSQL.
 */
import type { Pdf, PdfPublic } from '@sharanam/shared';

import { getSupabaseAdmin } from '../config/supabase';
import { deletePdfStorageObject } from './pdf-upload.service';
import { AppError } from '../utils/AppError';
import type {
  CreatePdfInput,
  ListPdfsQuery,
  UpdatePdfInput,
} from '../validators/pdf.validators';

const PDF_COLUMNS =
  'id, course_id, chapter_id, title, description, file_url, storage_key, file_size, mime_type, original_filename, sort_order, is_free, is_published, created_at, updated_at';

export type PdfListPage = {
  items: Pdf[];
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

async function syncChapterPdfCount(chapterId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from('pdfs')
    .select('id', { count: 'exact', head: true })
    .eq('chapter_id', chapterId)
    .eq('is_published', true);

  if (error) {
    throw new AppError(500, 'PDF_COUNT_SYNC_FAILED', error.message);
  }

  const { data: contents } = await supabase
    .from('chapter_contents')
    .select('id')
    .eq('chapter_id', chapterId)
    .eq('content_type', 'pdf');

  const legacy = contents?.length ?? 0;
  const pdf_count = (count ?? 0) + legacy;

  const { error: updateError } = await supabase
    .from('chapters')
    .update({
      pdf_count,
      updated_at: new Date().toISOString(),
    })
    .eq('id', chapterId);

  if (updateError) {
    throw new AppError(500, 'CHAPTER_META_SYNC_FAILED', updateError.message);
  }
}

function toPdf(
  row: Record<string, unknown>,
  titles?: { course_title?: string | null; chapter_title?: string | null },
): Pdf {
  return {
    id: row.id as string,
    course_id: row.course_id as string,
    chapter_id: row.chapter_id as string,
    title: row.title as string,
    description: (row.description as string) ?? '',
    file_url: row.file_url as string,
    storage_key: row.storage_key as string,
    file_size: Number(row.file_size) || 0,
    mime_type: (row.mime_type as string) || 'application/pdf',
    original_filename: (row.original_filename as string) || '',
    sort_order: Number(row.sort_order) || 0,
    is_free: Boolean(row.is_free),
    is_published: Boolean(row.is_published),
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
    course_title: titles?.course_title ?? null,
    chapter_title: titles?.chapter_title ?? null,
  };
}

export async function listPdfsForAdmin(filters: ListPdfsQuery): Promise<PdfListPage> {
  const supabase = getSupabaseAdmin();
  const page = filters.page;
  const pageSize = filters.pageSize;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('pdfs')
    .select(PDF_COLUMNS, { count: 'exact' })
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
        `title.ilike.%${safe}%,description.ilike.%${safe}%,original_filename.ilike.%${safe}%`,
      );
    }
  }

  const { data, error, count } = await query;
  if (error) {
    throw new AppError(500, 'PDFS_FETCH_FAILED', error.message);
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
    toPdf(row, {
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

export async function getPdfForAdmin(pdfId: string): Promise<Pdf> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('pdfs')
    .select(PDF_COLUMNS)
    .eq('id', pdfId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'PDF_FETCH_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'PDF_NOT_FOUND', 'PDF not found');
  }

  const titles = await assertChapterBelongsToCourse(
    data.course_id as string,
    data.chapter_id as string,
  );
  return toPdf(data as Record<string, unknown>, titles);
}

export async function createPdf(input: CreatePdfInput): Promise<Pdf> {
  const titles = await assertChapterBelongsToCourse(input.course_id, input.chapter_id);

  let sortOrder = input.sort_order;
  if (sortOrder === undefined || sortOrder === 0) {
    const supabase = getSupabaseAdmin();
    const { data: last } = await supabase
      .from('pdfs')
      .select('sort_order')
      .eq('chapter_id', input.chapter_id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();
    sortOrder = (Number(last?.sort_order) || 0) + 10;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('pdfs')
    .insert({
      course_id: input.course_id,
      chapter_id: input.chapter_id,
      title: input.title,
      description: input.description ?? '',
      file_url: input.file_url,
      storage_key: input.storage_key,
      file_size: input.file_size,
      mime_type: input.mime_type ?? 'application/pdf',
      original_filename: input.original_filename,
      sort_order: sortOrder,
      is_free: input.is_free ?? false,
      is_published: input.is_published ?? true,
      updated_at: new Date().toISOString(),
    })
    .select(PDF_COLUMNS)
    .single();

  if (error) {
    throw new AppError(400, 'PDF_CREATE_FAILED', error.message);
  }

  await syncChapterPdfCount(input.chapter_id);
  return toPdf(data as Record<string, unknown>, titles);
}

export async function updatePdf(pdfId: string, input: UpdatePdfInput): Promise<Pdf> {
  const supabase = getSupabaseAdmin();
  const { data: existing, error: lookupError } = await supabase
    .from('pdfs')
    .select(PDF_COLUMNS)
    .eq('id', pdfId)
    .maybeSingle();

  if (lookupError) {
    throw new AppError(500, 'PDF_FETCH_FAILED', lookupError.message);
  }
  if (!existing) {
    throw new AppError(404, 'PDF_NOT_FOUND', 'PDF not found');
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

  const replacingFile =
    input.file_url !== undefined &&
    input.storage_key !== undefined &&
    input.storage_key !== existing.storage_key;

  if (input.file_url !== undefined) patch.file_url = input.file_url;
  if (input.storage_key !== undefined) patch.storage_key = input.storage_key;
  if (input.file_size !== undefined) patch.file_size = input.file_size;
  if (input.mime_type !== undefined) patch.mime_type = input.mime_type;
  if (input.original_filename !== undefined) {
    patch.original_filename = input.original_filename;
  }

  const { data, error } = await supabase
    .from('pdfs')
    .update(patch)
    .eq('id', pdfId)
    .select(PDF_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new AppError(400, 'PDF_UPDATE_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'PDF_NOT_FOUND', 'PDF not found');
  }

  if (replacingFile) {
    await deletePdfStorageObject(existing.storage_key as string);
  }

  const oldChapter = existing.chapter_id as string;
  await syncChapterPdfCount(chapterId);
  if (oldChapter !== chapterId) {
    await syncChapterPdfCount(oldChapter);
  }

  return toPdf(data as Record<string, unknown>, titles);
}

export async function deletePdf(pdfId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: existing, error: lookupError } = await supabase
    .from('pdfs')
    .select('id, chapter_id, storage_key')
    .eq('id', pdfId)
    .maybeSingle();

  if (lookupError) {
    throw new AppError(500, 'PDF_FETCH_FAILED', lookupError.message);
  }
  if (!existing) {
    throw new AppError(404, 'PDF_NOT_FOUND', 'PDF not found');
  }

  const { error } = await supabase.from('pdfs').delete().eq('id', pdfId);
  if (error) {
    throw new AppError(400, 'PDF_DELETE_FAILED', error.message);
  }

  await deletePdfStorageObject(existing.storage_key as string);
  await syncChapterPdfCount(existing.chapter_id as string);
}

/**
 * Published PDFs for a chapter — hide file_url when paid + not enrolled.
 */
export async function listPdfsForChapterPublic(
  chapterId: string,
  options: { enrolled: boolean },
): Promise<PdfPublic[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('pdfs')
    .select(PDF_COLUMNS)
    .eq('chapter_id', chapterId)
    .eq('is_published', true)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new AppError(500, 'PDFS_FETCH_FAILED', error.message);
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
      file_size: Number(row.file_size) || 0,
      original_filename: (row.original_filename as string) || '',
      sort_order: Number(row.sort_order) || 0,
      is_free: isFree,
      is_locked,
      file_url: is_locked ? null : (row.file_url as string),
    };
  });
}
