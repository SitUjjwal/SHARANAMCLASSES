/**
 * Admin student management — list, detail, suspend, password reset,
 * purchased courses, test history, payments, Excel export.
 */
import ExcelJS from 'exceljs';
import type {
  AdminExcelExport,
  AdminStudent,
  AdminStudentCourse,
  AdminStudentListPage,
  AdminStudentPaymentItem,
  AdminStudentResetPasswordResult,
  AdminStudentTestHistoryItem,
} from '@sharanam/shared';

import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import { sanitizeSearchTerm } from '../utils/postgrestSafe';
import { writeAdminActivityLog } from './adminOps.service';
import type {
  ListStudentsQuery,
  ResetStudentPasswordInput,
  SuspendStudentInput,
  UpdateStudentInput,
} from '../validators/studentAdmin.validators';

const COLUMNS =
  'id, full_name, email, phone_number, class_level, medium, role, avatar_url, is_suspended, suspended_at, suspended_reason, created_at, updated_at';

const COLUMNS_LEGACY =
  'id, full_name, email, phone_number, class_level, medium, role, avatar_url, created_at, updated_at';

function formatInrFromPaise(amountPaise: number): string {
  return `₹${Math.round(amountPaise / 100).toLocaleString('en-IN')}`;
}

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
    is_suspended: Boolean(row.is_suspended),
    suspended_at: (row.suspended_at as string | null) ?? null,
    suspended_reason: (row.suspended_reason as string | null) ?? null,
    created_at: (row.created_at as string) || '',
    updated_at: (row.updated_at as string) || '',
    enrolled_courses: enrolledCourses,
  };
}

function generateTempPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%';
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)]!;
  const base = [
    pick(upper),
    pick(lower),
    pick(digits),
    pick(symbols),
    ...Array.from({ length: 8 }, () =>
      pick(upper + lower + digits),
    ),
  ];
  return base.sort(() => Math.random() - 0.5).join('');
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

function applyListFilters(builder: any, query: ListStudentsQuery): any {
  let next = builder.eq('role', 'student');

  const search = sanitizeSearchTerm(query.search);
  if (search) {
    next = next.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%,phone_number.ilike.%${search}%`,
    );
  }
  if (query.class_level) {
    next = next.eq('class_level', query.class_level);
  }
  if (query.medium) {
    next = next.eq('medium', query.medium);
  }
  if (query.status === 'active') {
    next = next.eq('is_suspended', false);
  } else if (query.status === 'suspended') {
    next = next.eq('is_suspended', true);
  }
  return next;
}

export async function listAdminStudents(
  query: ListStudentsQuery,
): Promise<AdminStudentListPage> {
  const supabase = getSupabaseAdmin();
  const page = query.page;
  const pageSize = query.pageSize;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let builder = applyListFilters(
    supabase
      .from('profiles')
      .select(COLUMNS as string, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to),
    query,
  );

  const { data, error, count } = await builder;
  if (error) {
    if (/is_suspended|suspended_at|suspended_reason/i.test(error.message)) {
      return listAdminStudentsLegacy(query);
    }
    if (/avatar_url/i.test(error.message)) {
      return listAdminStudentsLegacy(query, true);
    }
    throw new AppError(500, 'STUDENTS_LIST_FAILED', error.message);
  }

  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  const counts = await enrollmentCounts(rows.map((r) => r.id as string));
  const total = count ?? rows.length;

  return {
    items: rows.map((row) =>
      mapStudent(row, counts.get(row.id as string) ?? 0),
    ),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

async function listAdminStudentsLegacy(
  query: ListStudentsQuery,
  dropAvatar = false,
): Promise<AdminStudentListPage> {
  const supabase = getSupabaseAdmin();
  const page = query.page;
  const pageSize = query.pageSize;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const cols = dropAvatar
    ? 'id, full_name, email, phone_number, class_level, medium, role, created_at, updated_at'
    : COLUMNS_LEGACY;

  let builder = supabase
    .from('profiles')
    .select(cols as string, { count: 'exact' })
    .eq('role', 'student')
    .order('created_at', { ascending: false })
    .range(from, to);

  const search = sanitizeSearchTerm(query.search);
  if (search) {
    builder = builder.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%,phone_number.ilike.%${search}%`,
    );
  }
  if (query.class_level) builder = builder.eq('class_level', query.class_level);
  if (query.medium) builder = builder.eq('medium', query.medium);

  const { data, error, count } = await builder;
  if (error) {
    throw new AppError(500, 'STUDENTS_LIST_FAILED', error.message);
  }

  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  const counts = await enrollmentCounts(rows.map((r) => r.id as string));
  const total = count ?? rows.length;

  return {
    items: rows.map((row) =>
      mapStudent(
        {
          ...row,
          avatar_url: dropAvatar ? null : ((row.avatar_url as string | null) ?? null),
          is_suspended: false,
          suspended_at: null,
          suspended_reason: null,
        },
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
    .select(COLUMNS as string)
    .eq('id', studentId)
    .eq('role', 'student')
    .maybeSingle();

  if (error) {
    if (/is_suspended|suspended_at|suspended_reason|avatar_url/i.test(error.message)) {
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
        {
          ...(fallback.data as unknown as Record<string, unknown>),
          avatar_url: null,
          is_suspended: false,
          suspended_at: null,
          suspended_reason: null,
        },
        counts.get(studentId) ?? 0,
      );
    }
    throw new AppError(500, 'STUDENT_LOAD_FAILED', error.message);
  }

  if (!data) {
    throw new AppError(404, 'STUDENT_NOT_FOUND', 'Student not found');
  }

  const counts = await enrollmentCounts([studentId]);
  return mapStudent(data as unknown as Record<string, unknown>, counts.get(studentId) ?? 0);
}

export async function updateAdminStudent(
  studentId: string,
  input: UpdateStudentInput,
  actor?: { id: string; email: string | null },
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
    .select(COLUMNS as string)
    .maybeSingle();

  if (error) {
    // Retry without suspension columns in select
    if (/is_suspended|suspended/i.test(error.message)) {
      const retry = await supabase
        .from('profiles')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', studentId)
        .eq('role', 'student')
        .select(COLUMNS_LEGACY as string)
        .maybeSingle();
      if (retry.error) {
        throw new AppError(500, 'STUDENT_UPDATE_FAILED', retry.error.message);
      }
      if (!retry.data) {
        throw new AppError(404, 'STUDENT_NOT_FOUND', 'Student not found');
      }
      const counts = await enrollmentCounts([studentId]);
      return mapStudent(
        {
          ...(retry.data as unknown as Record<string, unknown>),
          is_suspended: false,
          suspended_at: null,
          suspended_reason: null,
        },
        counts.get(studentId) ?? 0,
      );
    }
    throw new AppError(500, 'STUDENT_UPDATE_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'STUDENT_NOT_FOUND', 'Student not found');
  }

  if (actor) {
    await writeAdminActivityLog({
      actor_id: actor.id,
      actor_email: actor.email,
      action: 'student.update',
      entity_type: 'student',
      entity_id: studentId,
      summary: `Updated student profile ${studentId}`,
      metadata: input as Record<string, unknown>,
    });
  }

  const counts = await enrollmentCounts([studentId]);
  return mapStudent(data as unknown as Record<string, unknown>, counts.get(studentId) ?? 0);
}

export async function suspendAdminStudent(
  studentId: string,
  input: SuspendStudentInput,
  actor: { id: string; email: string | null },
): Promise<AdminStudent> {
  const student = await getAdminStudent(studentId);
  if (student.is_suspended) {
    return student;
  }

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('profiles')
    .update({
      is_suspended: true,
      suspended_at: now,
      suspended_reason: input.reason?.trim() || null,
      updated_at: now,
    })
    .eq('id', studentId)
    .eq('role', 'student');

  if (error) {
    throw new AppError(
      500,
      'STUDENT_SUSPEND_FAILED',
      /is_suspended/i.test(error.message)
        ? 'Apply migration 20260803020000_student_suspension.sql first'
        : error.message,
    );
  }

  // Ban auth session (~100 years) so login is blocked
  const { error: banError } = await supabase.auth.admin.updateUserById(studentId, {
    ban_duration: '876000h',
  });
  if (banError) {
    console.warn('[admin/students] auth ban failed:', banError.message);
  }

  await writeAdminActivityLog({
    actor_id: actor.id,
    actor_email: actor.email,
    action: 'student.suspend',
    entity_type: 'student',
    entity_id: studentId,
    summary: `Suspended student ${student.email || studentId}`,
    metadata: { reason: input.reason ?? null },
  });

  return getAdminStudent(studentId);
}

export async function activateAdminStudent(
  studentId: string,
  actor: { id: string; email: string | null },
): Promise<AdminStudent> {
  const student = await getAdminStudent(studentId);
  if (!student.is_suspended) {
    return student;
  }

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('profiles')
    .update({
      is_suspended: false,
      suspended_at: null,
      suspended_reason: null,
      updated_at: now,
    })
    .eq('id', studentId)
    .eq('role', 'student');

  if (error) {
    throw new AppError(500, 'STUDENT_ACTIVATE_FAILED', error.message);
  }

  const { error: unbanError } = await supabase.auth.admin.updateUserById(studentId, {
    ban_duration: 'none',
  });
  if (unbanError) {
    console.warn('[admin/students] auth unban failed:', unbanError.message);
  }

  await writeAdminActivityLog({
    actor_id: actor.id,
    actor_email: actor.email,
    action: 'student.activate',
    entity_type: 'student',
    entity_id: studentId,
    summary: `Activated student ${student.email || studentId}`,
  });

  return getAdminStudent(studentId);
}

export async function resetAdminStudentPassword(
  studentId: string,
  input: ResetStudentPasswordInput,
  actor: { id: string; email: string | null },
): Promise<AdminStudentResetPasswordResult> {
  const student = await getAdminStudent(studentId);
  if (!student.email) {
    throw new AppError(400, 'STUDENT_NO_EMAIL', 'Student has no email for password reset');
  }

  const temporary_password = input.new_password?.trim() || generateTempPassword();
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.auth.admin.updateUserById(studentId, {
    password: temporary_password,
  });

  if (error) {
    throw new AppError(500, 'STUDENT_PASSWORD_RESET_FAILED', error.message);
  }

  await writeAdminActivityLog({
    actor_id: actor.id,
    actor_email: actor.email,
    action: 'student.reset_password',
    entity_type: 'student',
    entity_id: studentId,
    summary: `Reset password for student ${student.email}`,
  });

  return {
    student_id: studentId,
    email: student.email,
    temporary_password,
    message:
      'Temporary password generated. Share it securely with the student; it is shown only once.',
  };
}

export async function listAdminStudentCourses(
  studentId: string,
): Promise<AdminStudentCourse[]> {
  await getAdminStudent(studentId);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('enrollments')
    .select('id, course_id, progress_percent, enrolled_at')
    .eq('user_id', studentId)
    .order('enrolled_at', { ascending: false });

  if (error) {
    throw new AppError(500, 'STUDENT_COURSES_FAILED', error.message);
  }

  const rows = data ?? [];
  const courseIds = [...new Set(rows.map((r) => r.course_id as string))];
  const titleById = new Map<string, { title: string; is_published: boolean }>();

  if (courseIds.length) {
    const { data: courses, error: courseError } = await supabase
      .from('courses')
      .select('id, title, is_published')
      .in('id', courseIds);
    if (courseError) {
      throw new AppError(500, 'STUDENT_COURSES_FAILED', courseError.message);
    }
    for (const c of courses ?? []) {
      titleById.set(c.id as string, {
        title: (c.title as string) || 'Course',
        is_published: Boolean(c.is_published),
      });
    }
  }

  return rows.map((row) => {
    const meta = titleById.get(row.course_id as string);
    return {
      enrollment_id: row.id as string,
      course_id: row.course_id as string,
      course_title: meta?.title ?? 'Course',
      progress_percent: Number(row.progress_percent ?? 0),
      enrolled_at: (row.enrolled_at as string) || '',
      is_published: meta?.is_published ?? false,
    };
  });
}

export async function listAdminStudentTestHistory(
  studentId: string,
): Promise<AdminStudentTestHistoryItem[]> {
  await getAdminStudent(studentId);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('test_attempts')
    .select(
      'id, test_id, status, submitted_at, obtained_marks, percentage, is_passed',
    )
    .eq('user_id', studentId)
    .in('status', ['submitted', 'expired'])
    .order('submitted_at', { ascending: false })
    .limit(100);

  if (error) {
    throw new AppError(500, 'STUDENT_TESTS_FAILED', error.message);
  }

  const rows = data ?? [];
  const testIds = [...new Set(rows.map((r) => r.test_id as string))];
  const testMeta = new Map<string, { title: string; total_marks: number | null }>();

  if (testIds.length) {
    const { data: tests, error: testError } = await supabase
      .from('tests')
      .select('id, title, total_marks')
      .in('id', testIds);
    if (testError) {
      throw new AppError(500, 'STUDENT_TESTS_FAILED', testError.message);
    }
    for (const t of tests ?? []) {
      testMeta.set(t.id as string, {
        title: (t.title as string) || 'Test',
        total_marks:
          t.total_marks === null || t.total_marks === undefined
            ? null
            : Number(t.total_marks),
      });
    }
  }

  return rows.map((row) => {
    const meta = testMeta.get(row.test_id as string);
    return {
      attempt_id: row.id as string,
      test_id: row.test_id as string,
      test_title: meta?.title ?? 'Test',
      status: (row.status as string) || '',
      submitted_at: (row.submitted_at as string | null) ?? null,
      obtained_marks:
        row.obtained_marks === null || row.obtained_marks === undefined
          ? null
          : Number(row.obtained_marks),
      total_marks: meta?.total_marks ?? null,
      percentage:
        row.percentage === null || row.percentage === undefined
          ? null
          : Number(row.percentage),
      is_passed:
        row.is_passed === null || row.is_passed === undefined
          ? null
          : Boolean(row.is_passed),
    };
  });
}

export async function listAdminStudentPayments(
  studentId: string,
): Promise<AdminStudentPaymentItem[]> {
  await getAdminStudent(studentId);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('payment_orders')
    .select(
      'id, course_id, product_id, amount_paise, status, razorpay_payment_id, metadata, created_at, paid_at',
    )
    .eq('user_id', studentId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    throw new AppError(500, 'STUDENT_PAYMENTS_FAILED', error.message);
  }

  const rows = data ?? [];
  const courseIds = [
    ...new Set(
      rows
        .map((r) => r.course_id as string | null)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const titleByCourse = new Map<string, string>();
  if (courseIds.length) {
    const { data: courses } = await supabase
      .from('courses')
      .select('id, title')
      .in('id', courseIds);
    for (const c of courses ?? []) {
      titleByCourse.set(c.id as string, (c.title as string) || 'Course');
    }
  }

  return rows.map((row) => {
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    const metaTitle =
      (typeof meta.product_title === 'string' && meta.product_title) ||
      (typeof meta.course_title === 'string' && meta.course_title) ||
      null;
    const courseTitle =
      (row.course_id ? titleByCourse.get(row.course_id as string) : undefined) ??
      metaTitle ??
      'Product';

    return {
      order_id: row.id as string,
      course_title: courseTitle,
      amount_paise: Number(row.amount_paise ?? 0),
      amount_display: formatInrFromPaise(Number(row.amount_paise ?? 0)),
      status: (row.status as string) || '',
      payment_id: (row.razorpay_payment_id as string | null) ?? null,
      created_at: (row.created_at as string) || '',
      paid_at: (row.paid_at as string | null) ?? null,
    };
  });
}

export async function exportAdminStudentsExcel(
  query: ListStudentsQuery,
): Promise<AdminExcelExport> {
  const page = await listAdminStudents({
    ...query,
    page: 1,
    pageSize: 100,
  });

  // Fetch remaining pages up to a safe cap
  const all = [...page.items];
  for (let p = 2; p <= Math.min(page.totalPages, 20); p += 1) {
    const next = await listAdminStudents({ ...query, page: p, pageSize: 100 });
    all.push(...next.items);
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SHARANAM CLASSES Admin';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet('Students');

  sheet.columns = [
    { header: 'ID', key: 'id', width: 36 },
    { header: 'Full Name', key: 'full_name', width: 24 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Phone', key: 'phone_number', width: 16 },
    { header: 'Class', key: 'class_level', width: 12 },
    { header: 'Medium', key: 'medium', width: 10 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Enrolled Courses', key: 'enrolled_courses', width: 16 },
    { header: 'Joined', key: 'created_at', width: 22 },
    { header: 'Suspended Reason', key: 'suspended_reason', width: 28 },
  ];

  sheet.getRow(1).font = { bold: true };

  for (const s of all) {
    sheet.addRow({
      id: s.id,
      full_name: s.full_name,
      email: s.email,
      phone_number: s.phone_number,
      class_level: s.class_level,
      medium: s.medium,
      status: s.is_suspended ? 'Suspended' : 'Active',
      enrolled_courses: s.enrolled_courses,
      created_at: s.created_at,
      suspended_reason: s.suspended_reason ?? '',
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const stamp = new Date().toISOString().slice(0, 10);

  return {
    filename: `students-${stamp}.xlsx`,
    base64,
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
}
