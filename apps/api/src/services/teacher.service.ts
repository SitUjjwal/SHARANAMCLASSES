/**
 * Admin teacher directory — profiles with role instructor (admin also listed for course assign).
 */
import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import type { CreateTeacherInput, UpdateTeacherInput } from '../validators/teacher.validators';

export type TeacherOption = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  role: string;
};

function mapTeacher(row: Record<string, unknown>): TeacherOption {
  return {
    id: row.id as string,
    full_name: (row.full_name as string) || 'Teacher',
    email: (row.email as string) || '',
    phone_number: (row.phone_number as string) || '',
    role: (row.role as string) || 'instructor',
  };
}

export async function listTeachers(): Promise<TeacherOption[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone_number, role')
    .in('role', ['instructor', 'admin'])
    .order('full_name', { ascending: true });

  if (error) {
    throw new AppError(500, 'TEACHERS_FETCH_FAILED', error.message);
  }

  return (data ?? []).map((row) => mapTeacher(row as Record<string, unknown>));
}

export async function createTeacher(input: CreateTeacherInput): Promise<TeacherOption> {
  const supabase = getSupabaseAdmin();
  const email = input.email.trim().toLowerCase();

  const { data: existing, error: existingError } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone_number, role')
    .eq('email', email)
    .maybeSingle();

  if (existingError) {
    throw new AppError(500, 'TEACHERS_FETCH_FAILED', existingError.message);
  }

  if (existing) {
    if (existing.role === 'instructor' || existing.role === 'admin') {
      throw new AppError(409, 'TEACHER_EXISTS', 'A teacher with this email already exists');
    }
    if (!input.promote_if_exists) {
      throw new AppError(409, 'EMAIL_IN_USE', 'This email already belongs to a student account');
    }

    const { data: promoted, error: promoteError } = await supabase
      .from('profiles')
      .update({
        role: 'instructor',
        full_name: input.full_name,
        phone_number: input.phone_number,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('id, full_name, email, phone_number, role')
      .single();

    if (promoteError || !promoted) {
      throw new AppError(
        500,
        'TEACHER_PROMOTE_FAILED',
        promoteError?.message ?? 'Could not promote existing user to instructor',
      );
    }

    return mapTeacher(promoted as Record<string, unknown>);
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

  // Trigger creates profile as student — promote + sync display fields.
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .update({
      role: 'instructor',
      full_name: input.full_name,
      email,
      phone_number: input.phone_number,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select('id, full_name, email, phone_number, role')
    .single();

  if (profileError || !profile) {
    // Best-effort cleanup so we don't leave a half-created auth user.
    await supabase.auth.admin.deleteUser(userId);
    throw new AppError(
      500,
      'TEACHER_PROFILE_FAILED',
      profileError?.message ?? 'Teacher auth created but profile update failed',
    );
  }

  return mapTeacher(profile as Record<string, unknown>);
}

export async function updateTeacher(
  teacherId: string,
  input: UpdateTeacherInput,
): Promise<TeacherOption> {
  const supabase = getSupabaseAdmin();

  const { data: current, error: fetchError } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone_number, role')
    .eq('id', teacherId)
    .maybeSingle();

  if (fetchError) {
    throw new AppError(500, 'TEACHERS_FETCH_FAILED', fetchError.message);
  }
  if (!current) {
    throw new AppError(404, 'TEACHER_NOT_FOUND', 'Teacher not found');
  }
  if (current.role !== 'instructor' && current.role !== 'admin') {
    throw new AppError(400, 'NOT_A_TEACHER', 'Profile is not an instructor');
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.full_name !== undefined) patch.full_name = input.full_name;
  if (input.phone_number !== undefined) patch.phone_number = input.phone_number;

  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', teacherId)
    .select('id, full_name, email, phone_number, role')
    .single();

  if (updateError || !updated) {
    throw new AppError(
      500,
      'TEACHER_UPDATE_FAILED',
      updateError?.message ?? 'Could not update teacher',
    );
  }

  return mapTeacher(updated as Record<string, unknown>);
}

/** Demote instructor → student (keeps account; removes from teacher list). */
export async function removeTeacher(teacherId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { data: current, error: fetchError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', teacherId)
    .maybeSingle();

  if (fetchError) {
    throw new AppError(500, 'TEACHERS_FETCH_FAILED', fetchError.message);
  }
  if (!current) {
    throw new AppError(404, 'TEACHER_NOT_FOUND', 'Teacher not found');
  }
  if (current.role === 'admin') {
    throw new AppError(400, 'CANNOT_REMOVE_ADMIN', 'Admin accounts cannot be removed from Teachers');
  }
  if (current.role !== 'instructor') {
    throw new AppError(400, 'NOT_A_TEACHER', 'Profile is not an instructor');
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'student', updated_at: new Date().toISOString() })
    .eq('id', teacherId);

  if (updateError) {
    throw new AppError(500, 'TEACHER_REMOVE_FAILED', updateError.message);
  }
}
