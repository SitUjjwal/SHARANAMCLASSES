/**
 * Admin support chat API.
 */
import type {
  AdminSupportConversation,
  SupportChatMessage,
  SupportChatThread,
  SupportConversation,
} from '@sharanam/shared';

import { apiRequest } from '@/services/api';

export function listAdminSupportChats() {
  return apiRequest<AdminSupportConversation[]>('/admin/support/chats');
}

export function fetchAdminSupportChat(conversationId: string) {
  return apiRequest<
    SupportChatThread & { student_name: string; student_email: string | null }
  >(`/admin/support/chats/${conversationId}`);
}

export function sendAdminSupportMessage(conversationId: string, body: string) {
  return apiRequest<SupportChatMessage>(
    `/admin/support/chats/${conversationId}/messages`,
    { method: 'POST', body: { body } },
  );
}

export function markAdminSupportRead(conversationId: string) {
  return apiRequest<SupportConversation>(
    `/admin/support/chats/${conversationId}/read`,
    { method: 'POST' },
  );
}

export function setAdminSupportTyping(conversationId: string, typing: boolean) {
  return apiRequest<{ admin_typing: boolean }>(
    `/admin/support/chats/${conversationId}/typing`,
    { method: 'POST', body: { typing } },
  );
}
