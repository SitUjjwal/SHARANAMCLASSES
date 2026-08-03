/**
 * Admin teacher management — CRUD, course/live-class assign, statistics.
 */
import type {
  AdminTeacher,
  AdminTeacherCourse,
  AdminTeacherDetail,
  AdminTeacherLiveClass,
  AdminTeacherStats,
} from '@sharanam/shared';

import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import { writeActivityLog } from './activityLog.service';
import type { CreateTeacherInput, UpdateTeacherInput } from '../validators/teacher.validators';

/** @deprecated Prefer AdminTeacher — kept for course dropdown compat */
export type TeacherOption = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  role: string;
};

function mapBase(row: Record<string, unknown>): TeacherOption {
  return {
    id: row.id as string,
    full_name: (row.full_name as string) || 'Teacher',
    email: (row.email as string) || '',
    phone_number: (row.phone_number as string) || '',
    role: (row.role as string) || 'instructor',
  };
}

function mapTeacher(
  row: Record<string, unknown>,
  courseCount = 0,
  liveClassCount = 0,
): AdminTeacher {
  return {
    ...mapBase(row),
    course_count: courseCount,
    live_class_count: liveClassCount,
    created_at: (row.created_at as string | undefined) ?? undefined,
  };
}

async function assertTeacher(teacherId: string): Promise<AdminTeacher> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone_number, role, created_at')
    .eq('id', teacherId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'TEACHERS_FETCH_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'TEACHER_NOT_FOUND', 'Teacher not found');
  }
  if (data.role !== 'instructor' && data.role !== 'teacher' && data.role !== 'admin' && data.role !== 'super_admin') {
    throw new AppError(400, 'NOT_A_TEACHER', 'Profile is not an instructor');
  }

  const [course_count, live_class_count] = await Promise.all([
    countCoursesForTeacher(teacherId),
    countLiveClassesForTeacher(teacherId),
  ]);

  return mapTeacher(data as Record<string, unknown>, course_count, live_class_count);
}

async function countCoursesForTeacher(teacherId: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from('courses')
    .select('id', { count: 'exact', head: true })
    .eq('teacher_id', teacherId);
  if (error) {
    console.warn('[teachers] course count failed', error.message);
    return 0;
  }
  return count ?? 0;
}

async function countLiveClassesForTeacher(teacherId: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from('live_classes')
    .select('id', { count: 'exact', head: true })
    .eq('teacher_id', teacherId);
  if (error) {
    // Column may be missing before migration
    if (/teacher_id/i.test(error.message)) return 0;
    console.warn('[teachers] live class count failed', error.message);
    return 0;
  }
  return count ?? 0;
}

async function courseCountsByTeacher(
  teacherIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (!teacherIds.length) return map;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('courses')
    .select('teacher_id')
    .in('teacher_id', teacherIds);
  if (error) return map;
  for (const row of data ?? []) {
    const id = row.teacher_id as string;
    map.set(id, (map.get(id) ?? 0) + 1);
  }
  return map;
}

async function liveClassCountsByTeacher(
  teacherIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (!teacherIds.length) return map;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('live_classes')
    .select('teacher_id')
    .in('teacher_id', teacherIds);
  if (error) return map;
  for (const row of data ?? []) {
    const id = row.teacher_id as string | null;
    if (!id) continue;
    map.set(id, (map.get(id) ?? 0) + 1);
  }
  return map;
}

export async function listTeachers(): Promise<AdminTeacher[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone_number, role, created_at')
    .in('role', ['instructor', 'teacher', 'admin', 'super_admin'])
    .order('full_name', { ascending: true });

  if (error) {
    throw new AppError(500, 'TEACHERS_FETCH_FAILED', error.message);
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  const ids = rows.map((r) => r.id as string);
  const [courseMap, liveMap] = await Promise.all([
    courseCountsByTeacher(ids),
    liveClassCountsByTeacher(ids),
  ]);

  return rows.map((row) =>
    mapTeacher(
      row,
      courseMap.get(row.id as string) ?? 0,
      liveMap.get(row.id as string) ?? 0,
    ),
  );
}

export async function createTeacher(input: CreateTeacherInput): Promise<AdminTeacher> {
  const supabase = getSupabaseAdmin();
  const email = input.email.trim().toLowerCase();

  const { data: existing, error: existingError } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone_number, role, created_at')
    .eq('email', email)
    .maybeSingle();

  if (existingError) {
    throw new AppError(500, 'TEACHERS_FETCH_FAILED', existingError.message);
  }

  if (existing) {
    if (
      existing.role === 'instructor' ||
      existing.role === 'teacher' ||
      existing.role === 'admin' ||
      existing.role === 'super_admin'
    ) {
      throw new AppError(409, 'TEACHER_EXISTS', 'A teacher with this email already exists');
    }
    if (!input.promote_if_exists) {
      throw new AppError(409, 'EMAIL_IN_USE', 'This email already belongs to a student account');
    }

    const { data: promoted, error: promoteError } = await supabase
      .from('profiles')
      .update({
        role: 'teacher',
        full_name: input.full_name,
        phone_number: input.phone_number,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('id, full_name, email, phone_number, role, created_at')
      .single();

    if (promoteError || !promoted) {
      throw new AppError(
        500,
        'TEACHER_PROMOTE_FAILED',
        promoteError?.message ?? 'Could not promote existing user to instructor',
      );
    }

    const promotedTeacher = mapTeacher(promoted as Record<string, unknown>, 0, 0);
    await writeActivityLog({
      action: 'teacher.create',
      entity_type: 'teacher',
      entity_id: promotedTeacher.id,
      summary: `Teacher promoted from student · ${promotedTeacher.email}`,
      metadata: { promote_if_exists: true },
    });
    return promotedTeacher;
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: input.full_name,
      phone_number: input.phone_number,
      class_level: 'competitive',
      medium: 'hindi',
    },
  });

  if (authError || !authData.user) {
    throw new AppError(
      400,
      'TEACHER_CREATE_FAILED',
      authError?.message ?? 'Could not create teacher auth user',
    );
  }

  const userId = authData.user.id;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .update({
      role: 'teacher',
      full_name: input.full_name,
      email,
      phone_number: input.phone_number,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select('id, full_name, email, phone_number, role, created_at')
    .single();

  if (profileError || !profile) {
    await supabase.auth.admin.deleteUser(userId);
    throw new AppError(
      500,
      'TEACHER_PROFILE_FAILED',
      profileError?.message ?? 'Teacher auth created but profile update failed',
    );
  }

  const created = mapTeacher(profile as Record<string, unknown>, 0, 0);
  await writeActivityLog({
    actor_id: null,
    actor_email: null,
    action: 'teacher.create',
    entity_type: 'teacher',
    entity_id: created.id,
    summary: `Teacher created · ${created.email}`,
    metadata: { full_name: created.full_name },
  });
  return created;
}

export async function updateTeacher(
  teacherId: string,
  input: UpdateTeacherInput,
): Promise<AdminTeacher> {
  await assertTeacher(teacherId);
  const supabase = getSupabaseAdmin();

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.full_name !== undefined) patch.full_name = input.full_name;
  if (input.phone_number !== undefined) patch.phone_number = input.phone_number;

  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', teacherId)
    .select('id, full_name, email, phone_number, role, created_at')
    .single();

  if (updateError || !updated) {
    throw new AppError(
      500,
      'TEACHER_UPDATE_FAILED',
      updateError?.message ?? 'Could not update teacher',
    );
  }

  // Sync teacher_name on assigned courses when name changes
  if (input.full_name !== undefined) {
    await supabase
      .from('courses')
      .update({ teacher_name: input.full_name, updated_at: new Date().toISOString() })
      .eq('teacher_id', teacherId);
  }

  await writeActivityLog({
    action: 'teacher.update',
    entity_type: 'teacher',
    entity_id: teacherId,
    summary: `Teacher updated · ${teacherId}`,
    metadata: input as Record<string, unknown>,
  });

  return assertTeacher(teacherId);
}

/** Demote instructor → student; clear course + live class assignments. */
export async function removeTeacher(teacherId: string): Promise<void> {
  const teacher = await assertTeacher(teacherId);
  if (teacher.role === 'admin') {
    throw new AppError(400, 'CANNOT_REMOVE_ADMIN', 'Admin accounts cannot be removed from Teachers');
  }

  const supabase = getSupabaseAdmin();

  await supabase
    .from('courses')
    .update({
      teacher_id: null,
      teacher_name: null,
      updated_at: new Date().toISOString(),
    })
    .eq('teacher_id', teacherId);

  const { error: liveClearError } = await supabase
    .from('live_classes')
    .update({ teacher_id: null, updated_at: new Date().toISOString() })
    .eq('teacher_id', teacherId);
  if (liveClearError && !/teacher_id/i.test(liveClearError.message)) {
    throw new AppError(500, 'TEACHER_REMOVE_FAILED', liveClearError.message);
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'student', updated_at: new Date().toISOString() })
    .eq('id', teacherId);

  if (updateError) {
    throw new AppError(500, 'TEACHER_REMOVE_FAILED', updateError.message);
  }

  await writeActivityLog({
    action: 'teacher.remove',
    entity_type: 'teacher',
    entity_id: teacherId,
    summary: `Teacher removed (demoted) · ${teacher.email || teacherId}`,
  });
}

export async function getTeacherStats(teacherId: string): Promise<AdminTeacherStats> {
  await assertTeacher(teacherId);
  const supabase = getSupabaseAdmin();
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const { data: courses, error: courseError } = await supabase
    .from('courses')
    .select('id, is_published')
    .eq('teacher_id', teacherId);

  if (courseError) {
    throw new AppError(500, 'TEACHER_STATS_FAILED', courseError.message);
  }

  const courseRows = courses ?? [];
  const courseIds = courseRows.map((c) => c.id as string);
  const courses_published = courseRows.filter((c) => c.is_published).length;

  let total_enrollments = 0;
  if (courseIds.length) {
    const { count } = await supabase
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .in('course_id', courseIds);
    total_enrollments = count ?? 0;
  }

  let live_classes_assigned = 0;
  let live_classes_upcoming = 0;
  let live_classes_today = 0;

  const { data: lives, error: liveError } = await supabase
    .from('live_classes')
    .select('id, start_time, end_time')
    .eq('teacher_id', teacherId);

  if (!liveError && lives) {
    live_classes_assigned = lives.length;
    const nowIso = now.toISOString();
    for (const row of lives) {
      const start = row.start_time as string;
      if (start >= nowIso) live_classes_upcoming += 1;
      if (start >= dayStart.toISOString() && start < dayEnd.toISOString()) {
        live_classes_today += 1;
      }
    }
  }

  let feedback_count = 0;
  const { count: fbCount, error: fbError } = await supabase
    .from('student_feedback')
    .select('id', { count: 'exact', head: true })
    .eq('teacher_id', teacherId);
  if (!fbError) feedback_count = fbCount ?? 0;

  return {
    teacher_id: teacherId,
    courses_assigned: courseRows.length,
    courses_published,
    live_classes_assigned,
    live_classes_upcoming,
    live_classes_today,
    total_enrollments,
    feedback_count,
  };
}

export async function listTeacherCourses(
  teacherId: string,
): Promise<AdminTeacherCourse[]> {
  await assertTeacher(teacherId);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('courses')
    .select('id, title, is_published, teacher_id, teacher_name')
    .eq('teacher_id', teacherId)
    .order('title', { ascending: true });

  if (error) {
    throw new AppError(500, 'TEACHER_COURSES_FAILED', error.message);
  }

  const rows = data ?? [];
  const ids = rows.map((r) => r.id as string);
  const enrollMap = new Map<string, number>();
  if (ids.length) {
    const { data: enrolls } = await supabase
      .from('enrollments')
      .select('course_id')
      .in('course_id', ids);
    for (const e of enrolls ?? []) {
      const cid = e.course_id as string;
      enrollMap.set(cid, (enrollMap.get(cid) ?? 0) + 1);
    }
  }

  return rows.map((row) => ({
    id: row.id as string,
    title: (row.title as string) || 'Course',
    is_published: Boolean(row.is_published),
    teacher_id: (row.teacher_id as string | null) ?? null,
    teacher_name: (row.teacher_name as string | null) ?? null,
    enrollment_count: enrollMap.get(row.id as string) ?? 0,
  }));
}

export async function listTeacherLiveClasses(
  teacherId: string,
): Promise<AdminTeacherLiveClass[]> {
  await assertTeacher(teacherId);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('live_classes')
    .select('id, title, course_id, start_time, end_time, is_published, teacher_id')
    .eq('teacher_id', teacherId)
    .order('start_time', { ascending: false });

  if (error) {
    if (/teacher_id/i.test(error.message)) {
      throw new AppError(
        500,
        'TEACHER_LIVE_CLASSES_FAILED',
        'Apply migration 20260803030000_live_classes_teacher.sql first',
      );
    }
    throw new AppError(500, 'TEACHER_LIVE_CLASSES_FAILED', error.message);
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

  return rows.map((row) => ({
    id: row.id as string,
    title: (row.title as string) || 'Live class',
    course_id: (row.course_id as string | null) ?? null,
    course_title: row.course_id
      ? titleByCourse.get(row.course_id as string) ?? null
      : null,
    start_time: (row.start_time as string) || '',
    end_time: (row.end_time as string) || '',
    is_published: Boolean(row.is_published),
    teacher_id: (row.teacher_id as string | null) ?? null,
  }));
}

export async function getTeacherDetail(teacherId: string): Promise<AdminTeacherDetail> {
  const [teacher, stats, courses, live_classes] = await Promise.all([
    assertTeacher(teacherId),
    getTeacherStats(teacherId),
    listTeacherCourses(teacherId),
    listTeacherLiveClasses(teacherId),
  ]);
  return { teacher, stats, courses, live_classes };
}

/** Courses available to assign (unassigned or already this teacher). */
export async function listAssignableCourses(
  teacherId: string,
): Promise<AdminTeacherCourse[]> {
  await assertTeacher(teacherId);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('courses')
    .select('id, title, is_published, teacher_id, teacher_name')
    .or(`teacher_id.is.null,teacher_id.eq.${teacherId}`)
    .order('title', { ascending: true });

  if (error) {
    throw new AppError(500, 'TEACHER_COURSES_FAILED', error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    title: (row.title as string) || 'Course',
    is_published: Boolean(row.is_published),
    teacher_id: (row.teacher_id as string | null) ?? null,
    teacher_name: (row.teacher_name as string | null) ?? null,
    enrollment_count: 0,
  }));
}

/** Live classes available to assign (unassigned or already this teacher). */
export async function listAssignableLiveClasses(
  teacherId: string,
): Promise<AdminTeacherLiveClass[]> {
  await assertTeacher(teacherId);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('live_classes')
    .select('id, title, course_id, start_time, end_time, is_published, teacher_id')
    .or(`teacher_id.is.null,teacher_id.eq.${teacherId}`)
    .order('start_time', { ascending: false })
    .limit(200);

  if (error) {
    if (/teacher_id/i.test(error.message)) {
      throw new AppError(
        500,
        'TEACHER_LIVE_CLASSES_FAILED',
        'Apply migration 20260803030000_live_classes_teacher.sql first',
      );
    }
    throw new AppError(500, 'TEACHER_LIVE_CLASSES_FAILED', error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    title: (row.title as string) || 'Live class',
    course_id: (row.course_id as string | null) ?? null,
    course_title: null,
    start_time: (row.start_time as string) || '',
    end_time: (row.end_time as string) || '',
    is_published: Boolean(row.is_published),
    teacher_id: (row.teacher_id as string | null) ?? null,
  }));
}

/**
 * Replace course assignments for this teacher.
 * Courses in `courseIds` get this teacher; previously assigned courses not in the list are cleared.
 */
export async function assignTeacherCourses(
  teacherId: string,
  courseIds: string[],
  actor?: { id: string; email: string | null },
): Promise<AdminTeacherCourse[]> {
  const teacher = await assertTeacher(teacherId);
  const supabase = getSupabaseAdmin();
  const uniqueIds = [...new Set(courseIds.filter(Boolean))];

  // Clear courses currently assigned to this teacher but not in the new set
  const { data: current } = await supabase
    .from('courses')
    .select('id')
    .eq('teacher_id', teacherId);
  const currentIds = new Set((current ?? []).map((c) => c.id as string));
  const nextIds = new Set(uniqueIds);
  const toClear = [...currentIds].filter((id) => !nextIds.has(id));

  if (toClear.length) {
    const { error } = await supabase
      .from('courses')
      .update({
        teacher_id: null,
        teacher_name: null,
        updated_at: new Date().toISOString(),
      })
      .in('id', toClear);
    if (error) {
      throw new AppError(500, 'TEACHER_ASSIGN_COURSES_FAILED', error.message);
    }
  }

  if (uniqueIds.length) {
    const { error } = await supabase
      .from('courses')
      .update({
        teacher_id: teacherId,
        teacher_name: teacher.full_name,
        updated_at: new Date().toISOString(),
      })
      .in('id', uniqueIds);
    if (error) {
      throw new AppError(500, 'TEACHER_ASSIGN_COURSES_FAILED', error.message);
    }
  }

  if (actor) {
    await writeActivityLog({
      actor_id: actor.id,
      actor_email: actor.email,
      action: 'teacher.assign_courses',
      entity_type: 'teacher',
      entity_id: teacherId,
      summary: `Assigned ${uniqueIds.length} course(s) to ${teacher.full_name}`,
      metadata: { course_ids: uniqueIds },
    });
  }

  return listTeacherCourses(teacherId);
}

export async function assignTeacherLiveClasses(
  teacherId: string,
  liveClassIds: string[],
  actor?: { id: string; email: string | null },
): Promise<AdminTeacherLiveClass[]> {
  const teacher = await assertTeacher(teacherId);
  const supabase = getSupabaseAdmin();
  const uniqueIds = [...new Set(liveClassIds.filter(Boolean))];

  const { data: current, error: currentError } = await supabase
    .from('live_classes')
    .select('id')
    .eq('teacher_id', teacherId);

  if (currentError) {
    if (/teacher_id/i.test(currentError.message)) {
      throw new AppError(
        500,
        'TEACHER_ASSIGN_LIVE_FAILED',
        'Apply migration 20260803030000_live_classes_teacher.sql first',
      );
    }
    throw new AppError(500, 'TEACHER_ASSIGN_LIVE_FAILED', currentError.message);
  }

  const currentIds = new Set((current ?? []).map((c) => c.id as string));
  const nextIds = new Set(uniqueIds);
  const toClear = [...currentIds].filter((id) => !nextIds.has(id));

  if (toClear.length) {
    const { error } = await supabase
      .from('live_classes')
      .update({ teacher_id: null, updated_at: new Date().toISOString() })
      .in('id', toClear);
    if (error) {
      throw new AppError(500, 'TEACHER_ASSIGN_LIVE_FAILED', error.message);
    }
  }

  if (uniqueIds.length) {
    const { error } = await supabase
      .from('live_classes')
      .update({ teacher_id: teacherId, updated_at: new Date().toISOString() })
      .in('id', uniqueIds);
    if (error) {
      throw new AppError(500, 'TEACHER_ASSIGN_LIVE_FAILED', error.message);
    }
  }

  if (actor) {
    await writeActivityLog({
      actor_id: actor.id,
      actor_email: actor.email,
      action: 'teacher.assign_live_classes',
      entity_type: 'teacher',
      entity_id: teacherId,
      summary: `Assigned ${uniqueIds.length} live class(es) to ${teacher.full_name}`,
      metadata: { live_class_ids: uniqueIds },
    });
  }

  return listTeacherLiveClasses(teacherId);
}
