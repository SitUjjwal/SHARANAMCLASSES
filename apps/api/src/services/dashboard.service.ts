/**
 * Dashboard aggregate reads for the Home screen.
 * Why: one round-trip for greeting + catalog sections.
 */
import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import { listPublishedAnnouncements } from './announcement.service';
import { getContinueWatchingForUser } from './videoWatchProgress.service';
import type { DashboardPayload } from '@sharanam/shared';

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function getDashboardForUser(userId: string): Promise<DashboardPayload> {
  const supabase = getSupabaseAdmin();

  const [
    profileResult,
    quoteResult,
    bannersResult,
    categoriesResult,
    featuredResult,
    enrollmentsResult,
    announcements,
    continueWatching,
  ] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', userId).maybeSingle(),
    supabase
      .from('motivational_quotes')
      .select('id, quote_text, author')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('banners')
      .select(
        'id, title, subtitle, image, redirect_url, redirect_type, redirect_target_id, status, sort_order',
      )
      .eq('status', 'active')
      .order('sort_order', { ascending: true }),
    supabase
      .from('categories')
      .select('id, name, slug, icon, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('courses')
      .select(
        'id, category_id, title, slug, description, thumbnail_url, class_level, medium, stream, board, academic_year, subject, teacher_id, language, teacher_name, price, rating, is_free, is_featured, is_published, sort_order',
      )
      .eq('is_published', true)
      .eq('is_featured', true)
      .order('sort_order', { ascending: true })
      .limit(10),
    supabase
      .from('enrollments')
      .select(
        'id, user_id, course_id, progress_percent, enrolled_at, course:courses(id, category_id, title, slug, description, thumbnail_url, class_level, medium, stream, board, academic_year, subject, teacher_id, language, teacher_name, price, rating, is_free, is_featured, is_published, sort_order)',
      )
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false })
      .limit(10),
    listPublishedAnnouncements(8),
    getContinueWatchingForUser(userId),
  ]);

  const firstError =
    profileResult.error ||
    quoteResult.error ||
    bannersResult.error ||
    categoriesResult.error ||
    featuredResult.error ||
    enrollmentsResult.error;

  if (firstError) {
    throw new AppError(500, 'DASHBOARD_FETCH_FAILED', firstError.message);
  }

  const myCourses = (enrollmentsResult.data ?? []).map((row) => {
    const courseRaw = row.course;
    const course = Array.isArray(courseRaw) ? courseRaw[0] ?? null : courseRaw ?? null;
    const normalizedCourse = course
      ? {
          ...course,
          price: Number((course as { price?: number | string }).price) || 0,
          rating: Number((course as { rating?: number | string }).rating) || 0,
          teacher_name: (course as { teacher_name?: string | null }).teacher_name ?? null,
          is_free: Boolean((course as { is_free?: boolean }).is_free),
          is_purchased: true,
        }
      : null;
    return {
      id: row.id as string,
      user_id: row.user_id as string,
      course_id: row.course_id as string,
      progress_percent: row.progress_percent as number,
      enrolled_at: row.enrolled_at as string,
      course: normalizedCourse,
    };
  });

  const enrolledIds = new Set(myCourses.map((row) => row.course_id));
  const featuredCourses = (featuredResult.data ?? []).map((row) => ({
    ...row,
    price: Number((row as { price?: number | string }).price) || 0,
    rating: Number((row as { rating?: number | string }).rating) || 0,
    teacher_name: (row as { teacher_name?: string | null }).teacher_name ?? null,
    is_free: Boolean((row as { is_free?: boolean }).is_free),
    is_purchased: enrolledIds.has(row.id as string),
  }));

  return {
    greeting_name: profileResult.data?.full_name?.trim() || 'Student',
    quote: quoteResult.data
      ? {
          id: quoteResult.data.id,
          quote_text: quoteResult.data.quote_text,
          author: quoteResult.data.author,
        }
      : null,
    banners: bannersResult.data ?? [],
    categories: categoriesResult.data ?? [],
    featured_courses: featuredCourses,
    my_courses: myCourses,
    continue_watching: continueWatching,
    announcements,
    latest_updates: announcements.map((item) => ({
      id: item.id,
      title: item.title,
      body: stripHtml(item.body) || item.title,
      published_at: item.scheduled_at || item.published_at,
    })),
  };
}
