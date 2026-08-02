/**
 * feedbackService — student feedback tickets API.
 */
import type {
  ApiSuccessResponse,
  FeedbackTicket,
  FeedbackType,
  SubmitFeedbackTicketInput,
} from '@sharanam/shared';

import { apiClient } from '@/api/client';

export type FeedbackTeacherOption = {
  id: string;
  full_name: string;
};

export async function submitFeedbackTicket(
  input: SubmitFeedbackTicketInput,
): Promise<FeedbackTicket> {
  const { data } = await apiClient.post<ApiSuccessResponse<FeedbackTicket>>(
    '/feedback',
    input,
  );
  return data.data;
}

export async function fetchMyFeedbackTickets(): Promise<FeedbackTicket[]> {
  const { data } =
    await apiClient.get<ApiSuccessResponse<FeedbackTicket[]>>('/feedback');
  return data.data;
}

export async function fetchFeedbackTicket(
  feedbackId: string,
): Promise<FeedbackTicket> {
  const { data } = await apiClient.get<ApiSuccessResponse<FeedbackTicket>>(
    `/feedback/${feedbackId}`,
  );
  return data.data;
}

export async function updateFeedbackTicket(
  feedbackId: string,
  input: { title?: string; message?: string },
): Promise<FeedbackTicket> {
  const { data } = await apiClient.patch<ApiSuccessResponse<FeedbackTicket>>(
    `/feedback/${feedbackId}`,
    input,
  );
  return data.data;
}

export async function deleteFeedbackTicket(feedbackId: string): Promise<void> {
  await apiClient.delete<ApiSuccessResponse<null>>(`/feedback/${feedbackId}`);
}

export async function fetchFeedbackTeachers(): Promise<FeedbackTeacherOption[]> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<FeedbackTeacherOption[]>
  >('/feedback/teachers');
  return data.data;
}

/** Legacy helpers — map into feedback ticket types (not bug_reports) */
export async function submitComplaintFeedback(input: {
  title: string;
  description: string;
}): Promise<FeedbackTicket> {
  return submitFeedbackTicket({
    feedback_type: 'complaint',
    title: input.title,
    message: input.description,
  });
}

export async function submitFeatureRequest(input: {
  title: string;
  description: string;
}): Promise<FeedbackTicket> {
  return submitFeedbackTicket({
    feedback_type: 'suggestion',
    title: input.title,
    message: input.description,
  });
}

export async function submitFeedback(input: {
  rating?: number;
  message: string;
  category?: 'general' | 'bug' | 'feature';
  title?: string;
}): Promise<FeedbackTicket> {
  const type: FeedbackType =
    input.category === 'bug'
      ? 'complaint'
      : input.category === 'feature'
        ? 'suggestion'
        : 'general';
  return submitFeedbackTicket({
    feedback_type: type,
    title: input.title?.trim() || 'App feedback',
    message: input.message,
  });
}
