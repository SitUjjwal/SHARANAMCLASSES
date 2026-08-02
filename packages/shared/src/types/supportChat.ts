/**
 * Basic chat support domain types.
 */
export type SupportChatSenderRole = 'student' | 'admin';

export type SupportChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: SupportChatSenderRole;
  body: string;
  created_at: string;
  /** Convenience for mobile bubbles */
  from_support: boolean;
};

export type SupportConversation = {
  id: string;
  user_id: string;
  status: 'open' | 'closed';
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
  /** True when admin marked typing within the last few seconds */
  admin_typing: boolean;
  created_at: string;
  updated_at: string;
};

export type SupportChatThread = {
  conversation: SupportConversation;
  messages: SupportChatMessage[];
};

export type AdminSupportConversation = SupportConversation & {
  student_name: string;
  student_email: string | null;
};

export type SendSupportChatMessageInput = {
  body: string;
};
