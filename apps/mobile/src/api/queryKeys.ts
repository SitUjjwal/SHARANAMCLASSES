/**
 * React Query key factory — keeps cache keys consistent and typed.
 */
export const queryKeys = {
  dashboard: ['dashboard'] as const,
  banners: ['banners'] as const,
  categories: (search?: string) => ['categories', { search: search ?? '' }] as const,
  courses: (filters?: Record<string, unknown>) =>
    ['courses', 'list', filters ?? {}] as const,
  courseDetail: (courseId: string) => ['courses', 'detail', courseId] as const,
  chapters: (courseId: string) => ['courses', courseId, 'chapters'] as const,
  chapterDetail: (courseId: string, chapterId: string) =>
    ['courses', courseId, 'chapters', chapterId] as const,
  liveClasses: () => ['live-classes', 'public'] as const,
  myCourses: (search?: string) => ['my-courses', { search: search ?? '' }] as const,
  purchaseHistory: ['payments', 'history'] as const,
  notificationHistory: ['notifications', 'history'] as const,
  notificationUnreadCount: ['notifications', 'unread-count'] as const,
  profile: ['profile'] as const,
  studentTests: (courseId?: string) =>
    ['tests', 'student', { courseId: courseId ?? null }] as const,
  attemptSession: (attemptId: string) => ['tests', 'attempt', attemptId] as const,
  attemptResult: (attemptId: string) =>
    ['tests', 'attempt', attemptId, 'result'] as const,
  leaderboard: (filters?: Record<string, unknown>) =>
    ['tests', 'leaderboard', filters ?? {}] as const,
  testAnalytics: ['tests', 'analytics'] as const,
};
