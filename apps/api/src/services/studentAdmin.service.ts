/**
 * Admin student management — list / detail / update profiles.
 */
import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import type {
  ListStudentsQuery,
  UpdateStudentInput,
} from '../validators/studentAdmin.validators';

export type AdminStudent = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  class_level: string;
  medium: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  enrolled_courses: number;
};

export type AdminStudentListPage = {
  items: AdminStudent[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const COLUMNS =
  'id, full_name, email, phone_number, class_level, medium, role, avatar_url, created_at, updated_at';

function mapStudent(
  row: Record<string, unknown>,
  enrolledCourses = 0,
): AdminStudent {
  return {
    id: row.id as string,
    full_name: (row.full_name as string) || 'Student',
    email: (row.email as string) || '',
    phone_number: (row.phone_number as string) || '',
    class_level: (row.class_level as string) || '',
    medium: (row.medium as string) || '',
    role: (row.role as string) || 'student',
    avatar_url: (row.avatar_url as string | null) ?? null,
    created_at: (row.created_at as string) || '',
    updated_at: (row.updated_at as string) || '',
    enrolled_courses: enrolledCourses,
  };
}

async function enrollmentCounts(userIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (userIds.length === 0) return counts;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('enrollments')
    .select('user_id')
    .in('user_id', userIds);

  if (error) {
    console.warn('[admin/students] enrollment count failed', error.message);
    return counts;
  }

  for (const row of data ?? []) {
    const id = row.user_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

/**
 * listAdminStudents — paginated student directory (role = student).
 */
export async function listAdminStudents(
  query: ListStudentsQuery,
): Promise<AdminStudentListPage> {
  const supabase = getSupabaseAdmin();
  const page = query.page;
  const pageSize = query.pageSize;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let builder = supabase
    .from('profiles')
    .select(COLUMNS, { count: 'exact' })
    .eq('role', 'student')
    .order('created_at', { ascending: false })
    .range(from, to);

  const search = query.search.trim();
  if (search) {
    builder = builder.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%,phone_number.ilike.%${search}%`,
    );
  }

  if (query.class_level) {
    builder = builder.eq('class_level', query.class_level);
  }

  const { data, error, count } = await builder;
  if (error) {
    // Avatar column may be missing before migrations — retry without it
    if (/avatar_url/i.test(error.message)) {
      return listAdminStudentsWithoutAvatar(query);
    }
    throw new AppError(500, 'STUDENTS_LIST_FAILED', error.message);
  }

  const rows = data ?? [];
  const counts = await enrollmentCounts(rows.map((r) => r.id as string));
  const total = count ?? rows.length;

  return {
    items: rows.map((row) =>
      mapStudent(row as Record<string, unknown>, counts.get(row.id as string) ?? 0),
    ),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

async function listAdminStudentsWithoutAvatar(
  query: ListStudentsQuery,
): Promise<AdminStudentListPage> {
  const supabase = getSupabaseAdmin();
  const page = query.page;
  const pageSize = query.pageSize;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let builder = supabase
    .from('profiles')
    .select(
      'id, full_name, email, phone_number, class_level, medium, role, created_at, updated_at',
      { count: 'exact' },
    )
    .eq('role', 'student')
    .order('created_at', { ascending: false })
    .range(from, to);

  const search = query.search.trim();
  if (search) {
    builder = builder.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%,phone_number.ilike.%${search}%`,
    );
  }
  if (query.class_level) {
    builder = builder.eq('class_level', query.class_level);
  }

  const { data, error, count } = await builder;
  if (error) {
    throw new AppError(500, 'STUDENTS_LIST_FAILED', error.message);
  }

  const rows = data ?? [];
  const counts = await enrollmentCounts(rows.map((r) => r.id as string));
  const total = count ?? rows.length;

  return {
    items: rows.map((row) =>
      mapStudent(
        { ...(row as Record<string, unknown>), avatar_url: null },
        counts.get(row.id as string) ?? 0,
      ),
    ),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getAdminStudent(studentId: string): Promise<AdminStudent> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('profiles')
    .select(COLUMNS)
    .eq('id', studentId)
    .eq('role', 'student')
    .maybeSingle();

  if (error) {
    if (/avatar_url/i.test(error.message)) {
      const fallback = await supabase
        .from('profiles')
        .select(
          'id, full_name, email, phone_number, class_level, medium, role, created_at, updated_at',
        )
        .eq('id', studentId)
        .eq('role', 'student')
        .maybeSingle();
      if (fallback.error) {
        throw new AppError(500, 'STUDENT_LOAD_FAILED', fallback.error.message);
      }
      if (!fallback.data) {
        throw new AppError(404, 'STUDENT_NOT_FOUND', 'Student not found');
      }
      const counts = await enrollmentCounts([studentId]);
      return mapStudent(
        { ...(fallback.data as Record<string, unknown>), avatar_url: null },
        counts.get(studentId) ?? 0,
      );
    }
    throw new AppError(500, 'STUDENT_LOAD_FAILED', error.message);
  }

  if (!data) {
    throw new AppError(404, 'STUDENT_NOT_FOUND', 'Student not found');
  }

  const counts = await enrollmentCounts([studentId]);
  return mapStudent(data as Record<string, unknown>, counts.get(studentId) ?? 0);
}

export async function updateAdminStudent(
  studentId: string,
  input: UpdateStudentInput,
): Promise<AdminStudent> {
  await getAdminStudent(studentId);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', studentId)
    .eq('role', 'student')
    .select(COLUMNS)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'STUDENT_UPDATE_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'STUDENT_NOT_FOUND', 'Student not found');
  }

  const counts = await enrollmentCounts([studentId]);
  return mapStudent(data as Record<string, unknown>, counts.get(studentId) ?? 0);
}
