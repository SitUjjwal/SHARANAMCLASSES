/**
 * Profile overview — profile row + engagement stats for the Student Profile screen.
 */
import type { StudentProfileOverview } from '@sharanam/shared';

import { getStudentTestAnalytics } from './analytics.service';
import { getProfileByUserId } from './profile.service';
import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';

async function countOwnedCourses(userId: string): Promise<number> {
  const supabase = getSupabaseAdmin();

  const { count, error } = await supabase
    .from('enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    throw new AppError(500, 'PROFILE_STATS_FAILED', error.message);
  }

  return count ?? 0;
}

/**
 * getProfileOverview
 * Combines GET /profile fields with purchased-course + test aggregates.
 */
export async function getProfileOverview(
  userId: string,
): Promise<StudentProfileOverview> {
  const [profile, purchasedCourses, analytics] = await Promise.all([
    getProfileByUserId(userId),
    countOwnedCourses(userId),
    getStudentTestAnalytics(userId),
  ]);

  return {
    profile,
    stats: {
      purchased_courses: purchasedCourses,
      total_tests: analytics.summary.total_tests,
      average_score: analytics.summary.average_score,
    },
  };
}
