/**
 * Admin teacher directory — profiles with role instructor (or admin for testing).
 */
import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';

export type TeacherOption = {
  id: string;
  full_name: string;
  email: string;
  role: string;
};

export async function listTeachers(): Promise<TeacherOption[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .in('role', ['instructor', 'admin'])
    .order('full_name', { ascending: true });

  if (error) {
    throw new AppError(500, 'TEACHERS_FETCH_FAILED', error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    full_name: (row.full_name as string) || 'Teacher',
    email: (row.email as string) || '',
    role: (row.role as string) || 'instructor',
  }));
}
