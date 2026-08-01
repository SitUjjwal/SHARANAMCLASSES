/**
 * Student tests + attempt APIs (take test, timer, results).
 */
import { apiClient } from '@/api/client';
import type {
  ApiSuccessResponse,
  TestAttempt,
  TestAttemptResult,
  TestAttemptSession,
  TestPublic,
} from '@sharanam/shared';

export async function fetchStudentTests(params?: {
  courseId?: string;
  chapterId?: string;
}): Promise<TestPublic[]> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{ items: TestPublic[] }>
  >('/student/tests', { params });
  return data.data.items;
}

/** Start a new attempt or resume the in-progress one for this test. */
export async function startOrResumeAttempt(
  testId: string,
): Promise<TestAttemptSession> {
  const { data } = await apiClient.post<ApiSuccessResponse<TestAttemptSession>>(
    `/student/tests/${testId}/attempts`,
  );
  return data.data;
}

export async function fetchAttemptSession(
  attemptId: string,
): Promise<TestAttemptSession> {
  const { data } = await apiClient.get<ApiSuccessResponse<TestAttemptSession>>(
    `/student/attempts/${attemptId}`,
  );
  return data.data;
}

export type SaveAnswersPayload = {
  current_question_index?: number;
  answers: {
    question_id: string;
    selected_answer: 'A' | 'B' | 'C' | 'D' | null;
    is_marked_for_review: boolean;
  }[];
};

/** Debounced auto-save from the Test Screen. */
export async function saveAttemptAnswers(
  attemptId: string,
  payload: SaveAnswersPayload,
): Promise<TestAttemptSession> {
  const { data } = await apiClient.put<ApiSuccessResponse<TestAttemptSession>>(
    `/student/attempts/${attemptId}/answers`,
    payload,
  );
  return data.data;
}

/** Extend ends_at after Timer paused in background. */
export async function creditAttemptPause(
  attemptId: string,
  pausedMs: number,
): Promise<TestAttempt> {
  const { data } = await apiClient.post<ApiSuccessResponse<TestAttempt>>(
    `/student/attempts/${attemptId}/pause-credit`,
    { paused_ms: pausedMs },
  );
  return data.data;
}

/** Submit + score → Result Screen payload. */
export async function submitAttempt(
  attemptId: string,
  reason: 'manual' | 'auto' = 'manual',
): Promise<TestAttemptResult> {
  const { data } = await apiClient.post<ApiSuccessResponse<TestAttemptResult>>(
    `/student/attempts/${attemptId}/submit`,
    { reason },
  );
  return data.data;
}

/** Load scored result (after submit). */
export async function fetchAttemptResult(
  attemptId: string,
): Promise<TestAttemptResult> {
  const { data } = await apiClient.get<ApiSuccessResponse<TestAttemptResult>>(
    `/student/attempts/${attemptId}/result`,
  );
  return data.data;
}
