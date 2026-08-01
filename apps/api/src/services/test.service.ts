/**
 * test.service.ts — Test Series admin CRUD.
 *
 * Manages exam metadata: type, course/chapter, duration, marks.
 * Question bank / attempts ship in a follow-up module.
 */
import type { Test, TestType } from '@sharanam/shared';

import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import type {
  CreateTestInput,
  ListTestsQuery,
  UpdateTestInput,
} from '../validators/test.validators';

const TEST_COLUMNS =
  'id, title, description, instructions, test_type, course_id, chapter_id, duration_minutes, total_marks, passing_marks, sort_order, is_free, is_published, created_at, updated_at';

export type TestListPage = {
  items: Test[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

type TestRow = {
  id: string;
  title: string;
  description: string;
  instructions: string;
  test_type: TestType;
  course_id: string | null;
  chapter_id: string | null;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  sort_order: number;
  is_free: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

async function assertCourseExists(courseId: string): Promise<string> {
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

async function assertChapterBelongsToCourse(
  courseId: string,
  chapterId: string,
): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('chapters')
    .select('id, title, course_id')
    .eq('id', chapterId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'CHAPTER_LOOKUP_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'CHAPTER_NOT_FOUND', 'Chapter not found');
  }
  if (data.course_id !== courseId) {
    throw new AppError(
      400,
      'CHAPTER_COURSE_MISMATCH',
      'Selected chapter does not belong to the selected course',
    );
  }
  return data.title as string;
}

/** Enforce assignment rules after merge (create or update). */
async function validateAssignments(input: {
  test_type: TestType;
  course_id: string | null;
  chapter_id: string | null;
  total_marks: number;
  passing_marks: number;
}): Promise<{ course_title: string | null; chapter_title: string | null }> {
  if (input.passing_marks > input.total_marks) {
    throw new AppError(
      400,
      'INVALID_PASSING_MARKS',
      'Passing marks cannot exceed total marks',
    );
  }

  if (input.test_type === 'chapter_test') {
    if (!input.course_id || !input.chapter_id) {
      throw new AppError(
        400,
        'CHAPTER_TEST_REQUIRES_ASSIGNMENT',
        'Chapter Test requires both course and chapter',
      );
    }
  }

  if (input.test_type === 'subject_test' && !input.course_id) {
    throw new AppError(
      400,
      'SUBJECT_TEST_REQUIRES_COURSE',
      'Subject Test requires a course',
    );
  }

  if (input.chapter_id && !input.course_id) {
    throw new AppError(
      400,
      'COURSE_REQUIRED_FOR_CHAPTER',
      'Assign a course before assigning a chapter',
    );
  }

  let course_title: string | null = null;
  let chapter_title: string | null = null;

  if (input.course_id) {
    course_title = await assertCourseExists(input.course_id);
  }
  if (input.course_id && input.chapter_id) {
    chapter_title = await assertChapterBelongsToCourse(input.course_id, input.chapter_id);
  }

  return { course_title, chapter_title };
}

async function enrichTests(rows: TestRow[]): Promise<Test[]> {
  const supabase = getSupabaseAdmin();
  const courseIds = [
    ...new Set(rows.map((r) => r.course_id).filter((id): id is string => Boolean(id))),
  ];
  const chapterIds = [
    ...new Set(rows.map((r) => r.chapter_id).filter((id): id is string => Boolean(id))),
  ];

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

  return rows.map((row) => ({
    ...row,
    total_marks: Number(row.total_marks),
    passing_marks: Number(row.passing_marks),
    course_title: row.course_id ? courseMap.get(row.course_id) ?? null : null,
    chapter_title: row.chapter_id ? chapterMap.get(row.chapter_id) ?? null : null,
  }));
}

export async function listTestsForAdmin(query: ListTestsQuery): Promise<TestListPage> {
  const supabase = getSupabaseAdmin();
  const page = query.page;
  const pageSize = query.pageSize;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let dbQuery = supabase
    .from('tests')
    .select(TEST_COLUMNS, { count: 'exact' })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (query.courseId) {
    dbQuery = dbQuery.eq('course_id', query.courseId);
  }
  if (query.chapterId) {
    dbQuery = dbQuery.eq('chapter_id', query.chapterId);
  }
  if (query.testType !== 'all') {
    dbQuery = dbQuery.eq('test_type', query.testType);
  }
  if (query.access === 'free') {
    dbQuery = dbQuery.eq('is_free', true);
  } else if (query.access === 'paid') {
    dbQuery = dbQuery.eq('is_free', false);
  }
  if (query.status === 'published') {
    dbQuery = dbQuery.eq('is_published', true);
  } else if (query.status === 'draft') {
    dbQuery = dbQuery.eq('is_published', false);
  }

  const search = query.search?.trim();
  if (search) {
    const safe = search.replace(/[%_,.()]/g, '');
    if (safe) {
      dbQuery = dbQuery.or(
        `title.ilike.%${safe}%,description.ilike.%${safe}%,instructions.ilike.%${safe}%`,
      );
    }
  }

  const { data, error, count } = await dbQuery;
  if (error) {
    throw new AppError(500, 'TESTS_FETCH_FAILED', error.message);
  }

  const items = await enrichTests((data ?? []) as TestRow[]);
  const total = count ?? items.length;

  return {
    items,
    page,
    pageSize,
    total,
    hasMore: from + items.length < total,
  };
}

export async function getTestForAdmin(testId: string): Promise<Test> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('tests')
    .select(TEST_COLUMNS)
    .eq('id', testId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'TEST_FETCH_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'TEST_NOT_FOUND', 'Test not found');
  }

  const enriched = await enrichTests([data as TestRow]);
  const item = enriched[0];
  if (!item) {
    throw new AppError(404, 'TEST_NOT_FOUND', 'Test not found');
  }
  return item;
}

export async function createTest(input: CreateTestInput): Promise<Test> {
  const course_id = input.course_id ?? null;
  const chapter_id = input.chapter_id ?? null;

  const titles = await validateAssignments({
    test_type: input.test_type,
    course_id,
    chapter_id,
    total_marks: input.total_marks,
    passing_marks: input.passing_marks,
  });

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('tests')
    .insert({
      title: input.title,
      description: input.description ?? '',
      instructions: input.instructions ?? '',
      test_type: input.test_type,
      course_id,
      chapter_id,
      duration_minutes: input.duration_minutes,
      total_marks: input.total_marks,
      passing_marks: input.passing_marks,
      sort_order: input.sort_order ?? 0,
      is_free: input.is_free ?? false,
      is_published: input.is_published ?? false,
      updated_at: now,
    })
    .select(TEST_COLUMNS)
    .single();

  if (error) {
    throw new AppError(400, 'TEST_CREATE_FAILED', error.message);
  }

  const row = data as TestRow;
  return {
    ...row,
    total_marks: Number(row.total_marks),
    passing_marks: Number(row.passing_marks),
    course_title: titles.course_title,
    chapter_title: titles.chapter_title,
  };
}

export async function updateTest(testId: string, input: UpdateTestInput): Promise<Test> {
  const existing = await getTestForAdmin(testId);

  const merged = {
    test_type: (input.test_type ?? existing.test_type) as TestType,
    course_id:
      input.course_id !== undefined ? input.course_id : existing.course_id,
    chapter_id:
      input.chapter_id !== undefined ? input.chapter_id : existing.chapter_id,
    total_marks: input.total_marks ?? existing.total_marks,
    passing_marks: input.passing_marks ?? existing.passing_marks,
  };

  const titles = await validateAssignments(merged);

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.instructions !== undefined) patch.instructions = input.instructions;
  if (input.test_type !== undefined) patch.test_type = input.test_type;
  if (input.course_id !== undefined) patch.course_id = input.course_id;
  if (input.chapter_id !== undefined) patch.chapter_id = input.chapter_id;
  if (input.duration_minutes !== undefined) {
    patch.duration_minutes = input.duration_minutes;
  }
  if (input.total_marks !== undefined) patch.total_marks = input.total_marks;
  if (input.passing_marks !== undefined) patch.passing_marks = input.passing_marks;
  if (input.sort_order !== undefined) patch.sort_order = input.sort_order;
  if (input.is_free !== undefined) patch.is_free = input.is_free;
  if (input.is_published !== undefined) patch.is_published = input.is_published;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('tests')
    .update(patch)
    .eq('id', testId)
    .select(TEST_COLUMNS)
    .single();

  if (error) {
    throw new AppError(400, 'TEST_UPDATE_FAILED', error.message);
  }

  const row = data as TestRow;
  return {
    ...row,
    total_marks: Number(row.total_marks),
    passing_marks: Number(row.passing_marks),
    course_title: titles.course_title,
    chapter_title: titles.chapter_title,
  };
}

export async function deleteTest(testId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: existing, error: fetchError } = await supabase
    .from('tests')
    .select('id')
    .eq('id', testId)
    .maybeSingle();

  if (fetchError) {
    throw new AppError(500, 'TEST_FETCH_FAILED', fetchError.message);
  }
  if (!existing) {
    throw new AppError(404, 'TEST_NOT_FOUND', 'Test not found');
  }

  const { error } = await supabase.from('tests').delete().eq('id', testId);
  if (error) {
    throw new AppError(400, 'TEST_DELETE_FAILED', error.message);
  }
}

/**
 * Published tests for students (list). Lock rule mirrors media:
 * free OR enrolled in assigned course → unlocked.
 */
export async function listTestsPublic(options: {
  courseId?: string;
  chapterId?: string;
  testType?: TestType;
  enrolledCourseIds?: Set<string>;
}): Promise<import('@sharanam/shared').TestPublic[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('tests')
    .select(TEST_COLUMNS)
    .eq('is_published', true)
    .order('sort_order', { ascending: true });

  if (options.courseId) {
    query = query.eq('course_id', options.courseId);
  }
  if (options.chapterId) {
    query = query.eq('chapter_id', options.chapterId);
  }
  if (options.testType) {
    query = query.eq('test_type', options.testType);
  }

  const { data, error } = await query;
  if (error) {
    throw new AppError(500, 'TESTS_FETCH_FAILED', error.message);
  }

  const enriched = await enrichTests((data ?? []) as TestRow[]);
  const enrolled = options.enrolledCourseIds ?? new Set<string>();

  return enriched.map((test) => {
    const hasCourseAccess =
      !test.course_id || enrolled.has(test.course_id) || test.is_free;
    const is_locked = !hasCourseAccess;
    return {
      id: test.id,
      title: test.title,
      description: test.description,
      instructions: is_locked ? '' : test.instructions,
      test_type: test.test_type,
      course_id: test.course_id,
      chapter_id: test.chapter_id,
      duration_minutes: test.duration_minutes,
      total_marks: test.total_marks,
      passing_marks: test.passing_marks,
      sort_order: test.sort_order,
      is_free: test.is_free,
      is_locked,
      course_title: test.course_title,
      chapter_title: test.chapter_title,
    };
  });
}
