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
  profile: ['profile'] as const,
};
