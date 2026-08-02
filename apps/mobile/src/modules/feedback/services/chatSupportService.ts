/**
 * chatSupportService — student chat thread API.
 */
import type {
  ApiSuccessResponse,
  SupportChatMessage,
  SupportChatThread,
  SupportConversation,
} from '@sharanam/shared';

import { apiClient } from '@/api/client';

export async function fetchSupportChat(): Promise<SupportChatThread> {
  const { data } =
    await apiClient.get<ApiSuccessResponse<SupportChatThread>>('/support/chat');
  return data.data;
}

export async function fetchSupportChatUnreadCount(): Promise<number> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{ unread_count: number }>
  >('/support/chat/unread-count');
  return data.data.unread_count;
}

export async function sendSupportChatMessage(
  body: string,
): Promise<SupportChatMessage> {
  const { data } = await apiClient.post<ApiSuccessResponse<SupportChatMessage>>(
    '/support/chat/messages',
    { body },
  );
  return data.data;
}

export async function markSupportChatRead(): Promise<SupportConversation> {
  const { data } = await apiClient.post<ApiSuccessResponse<SupportConversation>>(
    '/support/chat/read',
  );
  return data.data;
}
