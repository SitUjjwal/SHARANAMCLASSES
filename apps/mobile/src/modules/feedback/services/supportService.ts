/**
 * supportService — tickets, FAQ, chat API stubs.
 */
import type { ApiSuccessResponse } from '@sharanam/shared';

import { apiClient } from '@/api/client';
import type { ChatBubbleData } from '@/modules/feedback/components/ChatBubble';
import type { FAQItemData } from '@/modules/feedback/components/FAQItem';
import type { SupportTicketData } from '@/modules/feedback/components/SupportTicket';

export async function fetchSupportTickets(): Promise<SupportTicketData[]> {
  const { data } =
    await apiClient.get<ApiSuccessResponse<SupportTicketData[]>>('/support/tickets');
  return data.data;
}

export async function createSupportTicket(input: {
  subject: string;
  message: string;
}): Promise<SupportTicketData> {
  const { data } = await apiClient.post<ApiSuccessResponse<SupportTicketData>>(
    '/support/tickets',
    input,
  );
  return data.data;
}

export async function fetchSupportFaqs(): Promise<FAQItemData[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<FAQItemData[]>>('/faqs');
  return data.data;
}

export async function submitContactMessage(input: {
  name: string;
  email: string;
  message: string;
}): Promise<void> {
  await apiClient.post<ApiSuccessResponse<null>>('/support/contact', input);
}

export async function fetchChatMessages(
  ticketId: string,
): Promise<ChatBubbleData[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<ChatBubbleData[]>>(
    `/support/tickets/${ticketId}/messages`,
  );
  return data.data;
}

export async function sendChatMessage(
  ticketId: string,
  body: string,
): Promise<ChatBubbleData> {
  const { data } = await apiClient.post<ApiSuccessResponse<ChatBubbleData>>(
    `/support/tickets/${ticketId}/messages`,
    { body },
  );
  return data.data;
}
