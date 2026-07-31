/**
 * Courses module public API.
 *
 * Folder structure
 * ----------------
 * modules/courses/
 *   components/
 *     CourseCard.tsx / StarRating / Search / Filters / Skeletons
 *     CourseDetailHero / CourseFeatures / ChapterList / RelatedCourses
 *   hooks/
 *     useCourseListInfiniteQuery / useCourseDetailQuery / useEnrollCourseMutation
 *   screens/
 *     CourseListScreen / CourseDetailScreen
 *   utils/formatCoursePrice.ts
 *   index.ts
 */
export { CourseCard } from './components/CourseCard';
export type { CourseCardProps } from './components/CourseCard';
export { StarRating } from './components/StarRating';
export { CourseSearchBar } from './components/CourseSearchBar';
export { CourseListFilters } from './components/CourseListFilters';
export type {
  CourseListFilterValues,
  PriceFilter,
} from './components/CourseListFilters';
export { CourseListSkeleton } from './components/CourseListSkeleton';
export { CourseDetailHero } from './components/CourseDetailHero';
export { CourseFeatures } from './components/CourseFeatures';
export { ChapterList } from './components/ChapterList';
export { RelatedCourses } from './components/RelatedCourses';
export { CourseDetailSkeleton } from './components/CourseDetailSkeleton';
export { CourseListScreen } from './screens/CourseListScreen';
export { CourseDetailScreen } from './screens/CourseDetailScreen';
export { useCourseListInfiniteQuery } from './hooks/useCourseListInfiniteQuery';
export { useCourseDetailQuery } from './hooks/useCourseDetailQuery';
export { useEnrollCourseMutation } from './hooks/useEnrollCourseMutation';
export { formatCoursePrice } from './utils/formatCoursePrice';
