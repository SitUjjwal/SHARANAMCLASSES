/**
 * Chapters module public API.
 *
 * Architecture
 * ------------
 * modules/chapters/
 *   components/ChapterCard.tsx
 *   hooks/useChaptersQuery.ts · useChapterContentQuery.ts
 *   screens/ChapterListScreen.tsx · ChapterContentScreen.tsx
 *   utils/formatDuration.ts
 *
 * Flow:
 *   CourseDetail → ChapterList { courseId }
 *                → ChapterContent { courseId, chapterId }
 *                     → VideoPlayer | PdfViewer | NoteViewer | Live (YouTube)
 *
 * Chapter content order: Videos → PDFs → Notes → Live Classes
 * Badges: Free preview · Locked
 *
 * API:
 *   GET /courses/:courseId/chapters
 *   GET /courses/:courseId/chapters/:chapterId
 *
 * Lock rule: unlocked if enrolled OR chapter.is_free_preview;
 * item URLs stripped when paid + not enrolled (is_locked)
 */
export { ChapterCard } from './components/ChapterCard';
export type { ChapterCardProps } from './components/ChapterCard';
export { ChapterListScreen } from './screens/ChapterListScreen';
export { ChapterContentScreen } from './screens/ChapterContentScreen';
export { useChaptersQuery } from './hooks/useChaptersQuery';
export { useChapterContentQuery } from './hooks/useChapterContentQuery';
export { formatDuration } from './utils/formatDuration';
