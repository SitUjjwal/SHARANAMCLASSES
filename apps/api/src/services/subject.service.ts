/**
 * Subjects catalog + batch ↔ subject links (batch = courses row).
 *
 * Hierarchy: Batch (courses) → batch_subjects → chapters → videos/pdfs/notes.
 * Purchase stays at batch level, so content gating is unchanged (courseAccess).
 */
import type {
  BatchSubject,
  StudentBatchSubject,
  Subject,
} from '@sharanam/shared';

import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import { sanitizeSearchTerm } from '../utils/postgrestSafe';
import type {
  AddBatchSubjectsInput,
  CreateSubjectInput,
  ListSubjectsQuery,
  UpdateBatchSubjectInput,
  UpdateSubjectInput,
} from '../validators/subject.validators';

const SUBJECT_COLUMNS =
  'id, name, code, description, icon_url, thumbnail_url, status, created_at, updated_at';

const BATCH_SUBJECT_COLUMNS =
  'id, batch_id, subject_id, teacher_id, sort_order, status, created_at, updated_at';

function toSubject(row: Record<string, unknown>): Subject {
  return {
    id: row.id as string,
    name: row.name as string,
    code: (row.code as string | null) ?? null,
    description: (row.description as string) ?? '',
    icon_url: (row.icon_url as string | null) ?? null,
    thumbnail_url: (row.thumbnail_url as string | null) ?? null,
    status: (row.status as 'active' | 'inactive') ?? 'active',
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

// ---------------------------------------------------------------------------
// Subjects master catalog
// ---------------------------------------------------------------------------

export async function listSubjects(filters: ListSubjectsQuery): Promise<Subject[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('subjects')
    .select(SUBJECT_COLUMNS)
    .order('name', { ascending: true });

  if (filters.status === 'active') query = query.eq('status', 'active');
  else if (filters.status === 'inactive') query = query.eq('status', 'inactive');

  const search = filters.search?.trim();
  if (search) {
    const safe = sanitizeSearchTerm(search);
    if (safe) query = query.or(`name.ilike.%${safe}%,code.ilike.%${safe}%`);
  }

  const { data, error } = await query;
  if (error) throw new AppError(500, 'SUBJECTS_FETCH_FAILED', error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(toSubject);
}

export async function createSubject(input: CreateSubjectInput): Promise<Subject> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('subjects')
    .insert({
      name: input.name,
      code: input.code ?? null,
      description: input.description ?? '',
      icon_url: input.icon_url ?? null,
      thumbnail_url: input.thumbnail_url ?? null,
      status: input.status ?? 'active',
      updated_at: new Date().toISOString(),
    })
    .select(SUBJECT_COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new AppError(409, 'SUBJECT_EXISTS', `Subject "${input.name}" already exists`);
    }
    throw new AppError(400, 'SUBJECT_CREATE_FAILED', error.message);
  }
  return toSubject(data as Record<string, unknown>);
}

export async function updateSubject(
  subjectId: string,
  input: UpdateSubjectInput,
): Promise<Subject> {
  const supabase = getSupabaseAdmin();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) patch.name = input.name;
  if (input.code !== undefined) patch.code = input.code;
  if (input.description !== undefined) patch.description = input.description;
  if (input.icon_url !== undefined) patch.icon_url = input.icon_url;
  if (input.thumbnail_url !== undefined) patch.thumbnail_url = input.thumbnail_url;
  if (input.status !== undefined) patch.status = input.status;

  const { data, error } = await supabase
    .from('subjects')
    .update(patch)
    .eq('id', subjectId)
    .select(SUBJECT_COLUMNS)
    .maybeSingle();

  if (error) throw new AppError(400, 'SUBJECT_UPDATE_FAILED', error.message);
  if (!data) throw new AppError(404, 'SUBJECT_NOT_FOUND', 'Subject not found');
  return toSubject(data as Record<string, unknown>);
}

export async function deleteSubject(subjectId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { count, error: usageError } = await supabase
    .from('batch_subjects')
    .select('id', { count: 'exact', head: true })
    .eq('subject_id', subjectId);

  if (usageError) throw new AppError(500, 'SUBJECT_USAGE_CHECK_FAILED', usageError.message);
  if ((count ?? 0) > 0) {
    throw new AppError(
      409,
      'SUBJECT_IN_USE',
      `Subject is attached to ${count} batch(es). Remove it from those batches first.`,
    );
  }

  const { error } = await supabase.from('subjects').delete().eq('id', subjectId);
  if (error) throw new AppError(400, 'SUBJECT_DELETE_FAILED', error.message);
}

// ---------------------------------------------------------------------------
// Batch ↔ subjects
// ---------------------------------------------------------------------------

async function assertBatchExists(batchId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('courses')
    .select('id')
    .eq('id', batchId)
    .maybeSingle();
  if (error) throw new AppError(500, 'BATCH_LOOKUP_FAILED', error.message);
  if (!data) throw new AppError(404, 'BATCH_NOT_FOUND', 'Batch not found');
}

type ContentCounts = {
  chapter_count: number;
  video_count: number;
  pdf_count: number;
  notes_count: number;
  test_count: number;
};

/** Aggregate content counts per batch_subject via chapter counters. */
async function contentCountsFor(batchSubjectIds: string[]): Promise<Map<string, ContentCounts>> {
  const counts = new Map<string, ContentCounts>();
  if (!batchSubjectIds.length) return counts;
  const supabase = getSupabaseAdmin();

  const { data: chapters, error } = await supabase
    .from('chapters')
    .select('id, batch_subject_id, video_count, pdf_count, notes_count')
    .in('batch_subject_id', batchSubjectIds);
  if (error) throw new AppError(500, 'CHAPTERS_FETCH_FAILED', error.message);

  const chapterIds: string[] = [];
  for (const ch of (chapters ?? []) as Record<string, unknown>[]) {
    const bsId = ch.batch_subject_id as string;
    chapterIds.push(ch.id as string);
    const entry = counts.get(bsId) ?? {
      chapter_count: 0,
      video_count: 0,
      pdf_count: 0,
      notes_count: 0,
      test_count: 0,
    };
    entry.chapter_count += 1;
    entry.video_count += Number(ch.video_count) || 0;
    entry.pdf_count += Number(ch.pdf_count) || 0;
    entry.notes_count += Number(ch.notes_count) || 0;
    counts.set(bsId, entry);
  }

  // Tests attached at subject level or chapter level
  const { data: subjectTests } = await supabase
    .from('tests')
    .select('id, batch_subject_id, chapter_id')
    .or(
      [
        `batch_subject_id.in.(${batchSubjectIds.join(',')})`,
        chapterIds.length ? `chapter_id.in.(${chapterIds.join(',')})` : '',
      ]
        .filter(Boolean)
        .join(','),
    );

  const chapterToBs = new Map(
    ((chapters ?? []) as Record<string, unknown>[]).map((ch) => [
      ch.id as string,
      ch.batch_subject_id as string,
    ]),
  );
  for (const t of (subjectTests ?? []) as Record<string, unknown>[]) {
    const bsId =
      (t.batch_subject_id as string | null) ??
      chapterToBs.get((t.chapter_id as string | null) ?? '') ??
      null;
    if (!bsId) continue;
    const entry = counts.get(bsId) ?? {
      chapter_count: 0,
      video_count: 0,
      pdf_count: 0,
      notes_count: 0,
      test_count: 0,
    };
    entry.test_count += 1;
    counts.set(bsId, entry);
  }

  return counts;
}

async function teacherNamesFor(teacherIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const ids = [...new Set(teacherIds.filter(Boolean))];
  if (!ids.length) return map;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from('profiles').select('id, full_name').in('id', ids);
  for (const row of (data ?? []) as { id: string; full_name: string }[]) {
    map.set(row.id, row.full_name);
  }
  return map;
}

export async function listBatchSubjects(batchId: string): Promise<BatchSubject[]> {
  await assertBatchExists(batchId);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('batch_subjects')
    .select(`${BATCH_SUBJECT_COLUMNS}, subject:subjects(${SUBJECT_COLUMNS})`)
    .eq('batch_id', batchId)
    .order('sort_order', { ascending: true });

  if (error) throw new AppError(500, 'BATCH_SUBJECTS_FETCH_FAILED', error.message);

  const rows = (data ?? []) as Record<string, unknown>[];
  const [counts, teacherNames] = await Promise.all([
    contentCountsFor(rows.map((r) => r.id as string)),
    teacherNamesFor(rows.map((r) => r.teacher_id as string).filter(Boolean)),
  ]);

  return rows.map((row) => {
    const c = counts.get(row.id as string);
    return {
      id: row.id as string,
      batch_id: row.batch_id as string,
      subject_id: row.subject_id as string,
      teacher_id: (row.teacher_id as string | null) ?? null,
      teacher_name: row.teacher_id ? (teacherNames.get(row.teacher_id as string) ?? null) : null,
      sort_order: Number(row.sort_order) || 0,
      status: (row.status as 'active' | 'inactive') ?? 'active',
      subject: toSubject(row.subject as Record<string, unknown>),
      chapter_count: c?.chapter_count ?? 0,
      video_count: c?.video_count ?? 0,
      pdf_count: c?.pdf_count ?? 0,
      notes_count: c?.notes_count ?? 0,
      test_count: c?.test_count ?? 0,
    };
  });
}

export async function getBatchSubject(batchSubjectId: string): Promise<BatchSubject> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('batch_subjects')
    .select(`${BATCH_SUBJECT_COLUMNS}, subject:subjects(${SUBJECT_COLUMNS})`)
    .eq('id', batchSubjectId)
    .maybeSingle();

  if (error) throw new AppError(500, 'BATCH_SUBJECT_FETCH_FAILED', error.message);
  if (!data) throw new AppError(404, 'BATCH_SUBJECT_NOT_FOUND', 'Subject not found in batch');

  const row = data as Record<string, unknown>;
  const [counts, teacherNames] = await Promise.all([
    contentCountsFor([row.id as string]),
    teacherNamesFor(row.teacher_id ? [row.teacher_id as string] : []),
  ]);
  const c = counts.get(row.id as string);

  return {
    id: row.id as string,
    batch_id: row.batch_id as string,
    subject_id: row.subject_id as string,
    teacher_id: (row.teacher_id as string | null) ?? null,
    teacher_name: row.teacher_id ? (teacherNames.get(row.teacher_id as string) ?? null) : null,
    sort_order: Number(row.sort_order) || 0,
    status: (row.status as 'active' | 'inactive') ?? 'active',
    subject: toSubject(row.subject as Record<string, unknown>),
    chapter_count: c?.chapter_count ?? 0,
    video_count: c?.video_count ?? 0,
    pdf_count: c?.pdf_count ?? 0,
    notes_count: c?.notes_count ?? 0,
    test_count: c?.test_count ?? 0,
  };
}

export async function addSubjectsToBatch(
  batchId: string,
  input: AddBatchSubjectsInput,
): Promise<BatchSubject[]> {
  await assertBatchExists(batchId);
  const supabase = getSupabaseAdmin();

  const { data: last } = await supabase
    .from('batch_subjects')
    .select('sort_order')
    .eq('batch_id', batchId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  let nextOrder = (Number(last?.sort_order) || 0) + 10;

  for (const item of input.subjects) {
    let subjectId = item.subject_id ?? null;

    if (!subjectId && item.name) {
      // Reuse subject with the same name (case-insensitive) or create it
      const { data: existing } = await supabase
        .from('subjects')
        .select('id')
        .ilike('name', item.name)
        .maybeSingle();
      if (existing) {
        subjectId = existing.id as string;
      } else {
        const created = await createSubject({
          name: item.name,
          description: '',
          status: 'active',
        });
        subjectId = created.id;
      }
    }
    if (!subjectId) continue;

    const { error } = await supabase.from('batch_subjects').upsert(
      {
        batch_id: batchId,
        subject_id: subjectId,
        teacher_id: item.teacher_id ?? null,
        sort_order: item.sort_order ?? nextOrder,
        status: 'active',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'batch_id,subject_id' },
    );
    if (error) throw new AppError(400, 'BATCH_SUBJECT_ADD_FAILED', error.message);
    nextOrder += 10;
  }

  return listBatchSubjects(batchId);
}

export async function updateBatchSubject(
  batchSubjectId: string,
  input: UpdateBatchSubjectInput,
): Promise<BatchSubject> {
  const supabase = getSupabaseAdmin();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.teacher_id !== undefined) patch.teacher_id = input.teacher_id;
  if (input.sort_order !== undefined) patch.sort_order = input.sort_order;
  if (input.status !== undefined) patch.status = input.status;

  const { data, error } = await supabase
    .from('batch_subjects')
    .update(patch)
    .eq('id', batchSubjectId)
    .select('id')
    .maybeSingle();

  if (error) throw new AppError(400, 'BATCH_SUBJECT_UPDATE_FAILED', error.message);
  if (!data) throw new AppError(404, 'BATCH_SUBJECT_NOT_FOUND', 'Subject not found in batch');
  return getBatchSubject(batchSubjectId);
}

export async function removeSubjectFromBatch(
  batchId: string,
  subjectId: string,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('batch_subjects')
    .delete()
    .eq('batch_id', batchId)
    .eq('subject_id', subjectId)
    .select('id');

  if (error) throw new AppError(400, 'BATCH_SUBJECT_REMOVE_FAILED', error.message);
  if (!data?.length) {
    throw new AppError(404, 'BATCH_SUBJECT_NOT_FOUND', 'Subject not found in batch');
  }
}

export async function reorderBatchSubjects(
  batchId: string,
  orderedIds: string[],
): Promise<BatchSubject[]> {
  await assertBatchExists(batchId);
  const supabase = getSupabaseAdmin();

  const { data: existing, error } = await supabase
    .from('batch_subjects')
    .select('id')
    .eq('batch_id', batchId);
  if (error) throw new AppError(500, 'BATCH_SUBJECTS_FETCH_FAILED', error.message);

  const validIds = new Set(((existing ?? []) as { id: string }[]).map((r) => r.id));
  let order = 10;
  for (const id of orderedIds) {
    if (!validIds.has(id)) continue;
    const { error: updateError } = await supabase
      .from('batch_subjects')
      .update({ sort_order: order, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (updateError) {
      throw new AppError(400, 'BATCH_SUBJECT_REORDER_FAILED', updateError.message);
    }
    order += 10;
  }
  return listBatchSubjects(batchId);
}

// ---------------------------------------------------------------------------
// Student view — active subjects of a published batch with progress
// ---------------------------------------------------------------------------

export async function listStudentBatchSubjects(
  batchId: string,
  userId: string,
): Promise<StudentBatchSubject[]> {
  const supabase = getSupabaseAdmin();

  const { data: batch, error: batchError } = await supabase
    .from('courses')
    .select('id, is_published')
    .eq('id', batchId)
    .eq('is_published', true)
    .maybeSingle();
  if (batchError) throw new AppError(500, 'BATCH_LOOKUP_FAILED', batchError.message);
  if (!batch) throw new AppError(404, 'BATCH_NOT_FOUND', 'Batch not found');

  const subjects = (await listBatchSubjects(batchId)).filter(
    (s) => s.status === 'active' && s.subject.status === 'active',
  );
  if (!subjects.length) return [];

  // Subject progress = completed videos / total videos in that subject
  const { data: progressRows } = await supabase
    .from('video_watch_progress')
    .select('chapter_id, completed')
    .eq('user_id', userId)
    .eq('course_id', batchId)
    .eq('completed', true);

  const { data: chapterRows } = await supabase
    .from('chapters')
    .select('id, batch_subject_id')
    .eq('course_id', batchId)
    .not('batch_subject_id', 'is', null);

  const chapterToBs = new Map(
    ((chapterRows ?? []) as { id: string; batch_subject_id: string }[]).map((c) => [
      c.id,
      c.batch_subject_id,
    ]),
  );
  const completedBySubject = new Map<string, number>();
  for (const row of (progressRows ?? []) as { chapter_id: string }[]) {
    const bsId = chapterToBs.get(row.chapter_id);
    if (!bsId) continue;
    completedBySubject.set(bsId, (completedBySubject.get(bsId) ?? 0) + 1);
  }

  return subjects.map((s) => {
    const completed = completedBySubject.get(s.id) ?? 0;
    const progress =
      s.video_count > 0 ? Math.min(100, Math.round((completed / s.video_count) * 100)) : 0;
    return {
      id: s.id,
      batch_id: s.batch_id,
      subject_id: s.subject_id,
      name: s.subject.name,
      code: s.subject.code,
      icon_url: s.subject.icon_url,
      thumbnail_url: s.subject.thumbnail_url,
      teacher_name: s.teacher_name,
      sort_order: s.sort_order,
      chapter_count: s.chapter_count,
      video_count: s.video_count,
      pdf_count: s.pdf_count,
      notes_count: s.notes_count,
      test_count: s.test_count,
      progress_percent: progress,
    };
  });
}
