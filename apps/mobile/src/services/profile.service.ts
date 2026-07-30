/**
 * Profile service — reads/writes `public.profiles`.
 * Why: keep profile DB access out of UI screens.
 * Future: updateProfile, getProfileById for Home / settings modules.
 */
import { supabase } from '@/auth/supabase';
import type { RegisterFormValues } from '@/auth/schemas';

export type StudentProfileInsert = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  class_level: RegisterFormValues['classLevel'];
  medium: RegisterFormValues['medium'];
};

/**
 * insertStudentProfile
 * Creates or updates the student's row in `profiles` after Auth signup.
 * Uses upsert so it is safe if a DB trigger already inserted a row.
 */
export async function insertStudentProfile(
  userId: string,
  values: RegisterFormValues,
): Promise<void> {
  const payload: StudentProfileInsert = {
    id: userId,
    full_name: values.fullName.trim(),
    email: values.email.trim().toLowerCase(),
    phone_number: values.phoneNumber.trim(),
    class_level: values.classLevel,
    medium: values.medium,
  };

  const { error } = await supabase.from('profiles').upsert(payload, {
    onConflict: 'id',
  });

  if (error) {
    throw error;
  }
}
