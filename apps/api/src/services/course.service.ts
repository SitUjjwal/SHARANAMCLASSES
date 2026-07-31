/**
 * Course catalog + admin CRUD (service role).
 */
import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import type { CourseDetail, CourseListPage, CourseSummary } from '@sharanam/shared';
import type {
  CreateCourseInput,
  ListCoursesQuery,
  UpdateCourseInput,
} from '../validators/course.validators';
import { listChaptersForCourse } from './chapter.service';

export const COURSE_COLUMNS =
  'id, category_id, title, slug, description, thumbnail_url, class_level, medium, stream, board, academic_year, subject, teacher_id, language, teacher_name, price, rating, is_free, is_featured, is_published, sort_order, features';

type CourseRow = Omit<CourseSummary, 'is_purchased' | 'price' | 'rating'> & {
  price: number | string;
  rating: number | string;
  features?: string[] | null;
  stream?: CourseSummary['stream'];
  board?: CourseSummary['board'];
  academic_year?: string | null;
  subject?: string | null;
  teacher_id?: string | null;
  language?: CourseSummary['language'];
};

function toSummary(row: CourseRow, purchasedIds: Set<string>): CourseSummary {
  const { features: _features, ...rest } = row;
  return {
    ...rest,
    stream: (row.stream as CourseSummary['stream']) ?? null,
    board: (row.board as CourseSummary['board']) ?? 'bihar_board',
    academic_year: row.academic_year ?? '2026-2027',
    subject: row.subject ?? null,
    teacher_id: row.teacher_id ?? null,
    language: (row.language as CourseSummary['language']) ?? row.medium ?? null,
    price: Number(row.price) || 0,
    rating: Math.min(5, Math.max(0, Number(row.rating) || 0)),
    is_purchased: purchasedIds.has(row.id),
  };
}

function defaultFeatures(row: CourseRow): string[] {
  const features = (row.features ?? []).filter((item) => item.trim().length > 0);
  if (features.length) {
    return features;
  }
  return [
    row.class_level ? `Designed for Class ${row.class_level}` : 'Structured school curriculum',
    row.board === 'bihar_board' ? 'Bihar Board aligned' : 'Board-aligned syllabus',
    row.subject ? `${row.subject} focused lessons` : null,
    row.medium ? `Taught in ${row.medium}` : 'Clear classroom-style teaching',
    'Chapter-wise video lessons',
    'Learn anytime on mobile',
  ].filter((item): item is string => Boolean(item));
}


async function getPurchasedCourseIds(
  userId: string,
  courseIds: string[],
): Promise<Set<string>> {
  if (!courseIds.length) {
    return new Set();
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('user_id', userId)
    .in('course_id', courseIds);

  if (error) {
    throw new AppError(500, 'ENROLLMENTS_FETCH_FAILED', error.message);
  }

  return new Set((data ?? []).map((row) => row.course_id as string));
}

/**
 * Paginated published catalog with search / filters / purchased badges.
 */
export async function listPublishedCourses(
  userId: string,
  filters: ListCoursesQuery,
): Promise<CourseListPage> {
  const supabase = getSupabaseAdmin();
  const page = filters.page;
  const pageSize = filters.pageSize;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('courses')
    .select(COURSE_COLUMNS, { count: 'exact' })
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .range(from, to);

  const search = filters.search?.trim();
  if (search) {
    const safe = search.replace(/[%_,.()]/g, '');
    if (safe) {
      query = query.or(
        `title.ilike.%${safe}%,description.ilike.%${safe}%,teacher_name.ilike.%${safe}%`,
      );
    }
  }

  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }
  if (filters.featured) {
    query = query.eq('is_featured', true);
  }
  if (filters.classLevel) {
    query = query.eq('class_level', filters.classLevel);
  }
  if (filters.medium) {
    query = query.eq('medium', filters.medium);
  }
  if (filters.stream) {
    query = query.eq('stream', filters.stream);
  }
  if (filters.board) {
    query = query.eq('board', filters.board);
  }
  if (filters.academicYear) {
    query = query.eq('academic_year', filters.academicYear);
  }
  if (filters.subject) {
    const safeSubject = filters.subject.replace(/[%_,.()]/g, '').trim();
    if (safeSubject) {
      query = query.ilike('subject', `%${safeSubject}%`);
    }
  }
  if (filters.price === 'free') {
    query = query.eq('is_free', true);
  } else if (filters.price === 'paid') {
    query = query.eq('is_free', false);
  }

  const { data, error, count } = await query;
  if (error) {
    throw new AppError(500, 'COURSES_FETCH_FAILED', error.message);
  }

  const rows = (data ?? []) as CourseRow[];
  const purchasedIds = await getPurchasedCourseIds(
    userId,
    rows.map((row) => row.id),
  );
  const items = rows.map((row) => toSummary(row, purchasedIds));
  const total = count ?? 0;

  return {
    items,
    page,
    pageSize,
    total,
    hasMore: from + items.length < total,
  };
}

export async function listAllCoursesForAdmin(): Promise<CourseSummary[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('courses')
    .select(COURSE_COLUMNS)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new AppError(500, 'COURSES_FETCH_FAILED', error.message);
  }

  return ((data ?? []) as CourseRow[]).map((row) => toSummary(row, new Set()));
}

/**
 * Paginated admin catalog (includes inactive / unpublished).
 */
export async function listCoursesForAdmin(
  filters: import('../validators/course.validators').AdminListCoursesQuery,
): Promise<CourseListPage> {
  const supabase = getSupabaseAdmin();
  const page = filters.page;
  const pageSize = filters.pageSize;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('courses')
    .select(COURSE_COLUMNS, { count: 'exact' })
    .order('updated_at', { ascending: false })
    .range(from, to);

  const search = filters.search?.trim();
  if (search) {
    const safe = search.replace(/[%_,.()]/g, '');
    if (safe) {
      query = query.or(
        `title.ilike.%${safe}%,slug.ilike.%${safe}%,teacher_name.ilike.%${safe}%`,
      );
    }
  }

  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }
  if (filters.status === 'active') {
    query = query.eq('is_published', true);
  } else if (filters.status === 'inactive') {
    query = query.eq('is_published', false);
  }
  if (filters.price === 'free') {
    query = query.eq('is_free', true);
  } else if (filters.price === 'paid') {
    query = query.eq('is_free', false);
  }
  if (filters.classLevel) {
    query = query.eq('class_level', filters.classLevel);
  }
  if (filters.medium) {
    query = query.eq('medium', filters.medium);
  }
  if (filters.stream) {
    query = query.eq('stream', filters.stream);
  }
  if (filters.board) {
    query = query.eq('board', filters.board);
  }
  if (filters.academicYear) {
    query = query.eq('academic_year', filters.academicYear);
  }
  if (filters.subject) {
    const safeSubject = filters.subject.replace(/[%_,.()]/g, '').trim();
    if (safeSubject) {
      query = query.ilike('subject', `%${safeSubject}%`);
    }
  }

  const { data, error, count } = await query;
  if (error) {
    throw new AppError(500, 'COURSES_FETCH_FAILED', error.message);
  }

  const rows = (data ?? []) as CourseRow[];
  const items = rows.map((row) => toSummary(row, new Set()));
  const total = count ?? 0;

  return {
    items,
    page,
    pageSize,
    total,
    hasMore: from + items.length < total,
  };
}

export async function getCourseForAdmin(courseId: string): Promise<CourseSummary> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('courses')
    .select(COURSE_COLUMNS)
    .eq('id', courseId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'COURSE_FETCH_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found');
  }
  return toSummary(data as CourseRow, new Set());
}

export async function getCourseDetail(
  courseId: string,
  userId?: string,
): Promise<CourseDetail> {
  const supabase = getSupabaseAdmin();

  const { data: course, error } = await supabase
    .from('courses')
    .select(COURSE_COLUMNS)
    .eq('id', courseId)
    .eq('is_published', true)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'COURSE_FETCH_FAILED', error.message);
  }
  if (!course) {
    throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found');
  }

  const courseRow = course as CourseRow;

  const [chapters, relatedResult] = await Promise.all([
    listChaptersForCourse(courseId, {
      publishedOnly: true,
      userId,
    }),
    courseRow.category_id
      ? supabase
          .from('courses')
          .select(COURSE_COLUMNS)
          .eq('is_published', true)
          .eq('category_id', courseRow.category_id)
          .neq('id', courseId)
          .order('sort_order', { ascending: true })
          .limit(6)
      : Promise.resolve({ data: [] as CourseRow[], error: null }),
  ]);

  if (relatedResult.error) {
    throw new AppError(500, 'RELATED_COURSES_FETCH_FAILED', relatedResult.error.message);
  }

  const relatedRows = (relatedResult.data ?? []) as CourseRow[];
  const allIds = [courseId, ...relatedRows.map((row) => row.id)];
  const purchasedIds = userId
    ? await getPurchasedCourseIds(userId, allIds)
    : new Set<string>();

  return {
    ...toSummary(courseRow, purchasedIds),
    features: defaultFeatures(courseRow),
    chapters,
    related_courses: relatedRows.map((row) => toSummary(row, purchasedIds)),
  };
}

/**
 * Enroll in a free course.
 * Paid courses must go through Razorpay (POST /payments/orders + /payments/verify).
 */
export async function enrollInCourse(
  userId: string,
  courseId: string,
): Promise<{ course_id: string; enrolled_at: string }> {
  const supabase = getSupabaseAdmin();

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, is_published, is_free, price')
    .eq('id', courseId)
    .eq('is_published', true)
    .maybeSingle();

  if (courseError) {
    throw new AppError(500, 'COURSE_FETCH_FAILED', courseError.message);
  }
  if (!course) {
    throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found');
  }

  const isFree = Boolean(course.is_free) || Number(course.price) <= 0;
  if (!isFree) {
    throw new AppError(
      402,
      'PAYMENT_REQUIRED',
      'This is a paid course. Create a Razorpay order via POST /payments/orders',
    );
  }

  const { data: existing, error: existingError } = await supabase
    .from('enrollments')
    .select('id, course_id, enrolled_at')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (existingError) {
    throw new AppError(500, 'ENROLLMENT_FETCH_FAILED', existingError.message);
  }
  if (existing) {
    return {
      course_id: existing.course_id as string,
      enrolled_at: existing.enrolled_at as string,
    };
  }

  const { data, error } = await supabase
    .from('enrollments')
    .insert({
      user_id: userId,
      course_id: courseId,
      progress_percent: 0,
    })
    .select('course_id, enrolled_at')
    .single();

  if (error) {
    throw new AppError(400, 'ENROLLMENT_FAILED', error.message);
  }

  return {
    course_id: data.course_id as string,
    enrolled_at: data.enrolled_at as string,
  };
}

export async function createCourse(
  input: CreateCourseInput,
  createdBy: string,
): Promise<CourseSummary> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('courses')
    .insert({
      ...input,
      created_by: createdBy,
      updated_at: new Date().toISOString(),
    })
    .select(COURSE_COLUMNS)
    .single();

  if (error) {
    throw new AppError(400, 'COURSE_CREATE_FAILED', error.message);
  }
  return toSummary(data as CourseRow, new Set());
}

export async function updateCourse(
  courseId: string,
  input: UpdateCourseInput,
): Promise<CourseSummary> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('courses')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', courseId)
    .select(COURSE_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new AppError(400, 'COURSE_UPDATE_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found');
  }
  return toSummary(data as CourseRow, new Set());
}

export async function deleteCourse(courseId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error, count } = await supabase
    .from('courses')
    .delete({ count: 'exact' })
    .eq('id', courseId);

  if (error) {
    throw new AppError(400, 'COURSE_DELETE_FAILED', error.message);
  }
  if (!count) {
    throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found');
  }
}
