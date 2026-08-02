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
 * Stats failures degrade to zeros so the Profile hub still loads.
 */
export async function getProfileOverview(
  userId: string,
): Promise<StudentProfileOverview> {
  const profile = await getProfileByUserId(userId);

  let purchasedCourses = 0;
  let totalTests = 0;
  let averageScore = 0;

  try {
    purchasedCourses = await countOwnedCourses(userId);
  } catch (err) {
    console.warn('[profile/overview] enrollments count failed', err);
  }

  try {
    const analytics = await getStudentTestAnalytics(userId);
    totalTests = analytics.summary.total_tests;
    averageScore = analytics.summary.average_score;
  } catch (err) {
    console.warn('[profile/overview] analytics failed', err);
  }

  return {
    profile,
    stats: {
      purchased_courses: purchasedCourses,
      total_tests: totalTests,
      average_score: averageScore,
    },
  };
}
