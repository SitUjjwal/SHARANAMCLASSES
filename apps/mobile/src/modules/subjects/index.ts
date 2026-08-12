/**
 * Subjects module public API.
 *
 * Batch → Subject → Chapter flow:
 *   CourseDetail → SubjectList { batchId, batchTitle }
 *                → ChapterList { courseId, batchSubjectId, subjectName }
 *
 * API:
 *   GET /student/batches/:batchId/subjects
 *   GET /student/batch-subjects/:batchSubjectId/chapters
 *
 * Legacy courses return an empty subjects array and go straight to ChapterList.
 */
export { SubjectCard } from './components/SubjectCard';
export { SubjectListScreen } from './screens/SubjectListScreen';
export { useBatchSubjectsQuery } from './hooks/useBatchSubjectsQuery';
export { useBatchSubjectChaptersQuery } from './hooks/useBatchSubjectChaptersQuery';
