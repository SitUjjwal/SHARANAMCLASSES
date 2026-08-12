/**
 * Subjects API — batch subjects list + chapters inside a batch subject.
 *
 * Batch → Subject → Chapter architecture:
 *   GET /student/batches/:batchId/subjects (empty array = legacy course)
 *   GET /student/batch-subjects/:batchSubjectId/chapters (same Chapter shape
 *   as GET /courses/:id/chapters, including lock flags)
 */
import { apiClient } from '@/api/client';
import type {
  ApiSuccessResponse,
  Chapter,
  StudentBatchSubject,
} from '@sharanam/shared';

export async function fetchBatchSubjects(
  batchId: string,
): Promise<StudentBatchSubject[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<StudentBatchSubject[]>>(
    `/student/batches/${batchId}/subjects`,
  );
  return data.data;
}

export async function fetchBatchSubjectChapters(
  batchSubjectId: string,
): Promise<Chapter[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<Chapter[]>>(
    `/student/batch-subjects/${batchSubjectId}/chapters`,
  );
  return data.data;
}
