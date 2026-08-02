/**
 * Admin student feedback API.
 */
import type {
  AdminFeedbackTicket,
  FeedbackTicket,
  FeedbackTicketStatus,
  FeedbackType,
  UpdateFeedbackTicketStatusInput,
} from '@sharanam/shared';

import { apiRequest } from '@/services/api';

export async function listAdminFeedback(params?: {
  status?: FeedbackTicketStatus;
  feedback_type?: FeedbackType;
}): Promise<AdminFeedbackTicket[]> {
  return apiRequest<AdminFeedbackTicket[]>('/admin/feedback', {
    params: {
      ...(params?.status ? { status: params.status } : {}),
      ...(params?.feedback_type ? { feedback_type: params.feedback_type } : {}),
    },
  });
}

export async function updateAdminFeedback(
  feedbackId: string,
  body: UpdateFeedbackTicketStatusInput,
): Promise<FeedbackTicket> {
  return apiRequest<FeedbackTicket>(`/admin/feedback/${feedbackId}`, {
    method: 'PATCH',
    body,
  });
}

export async function deleteAdminFeedback(feedbackId: string): Promise<void> {
  await apiRequest<null>(`/admin/feedback/${feedbackId}`, {
    method: 'DELETE',
  });
}
