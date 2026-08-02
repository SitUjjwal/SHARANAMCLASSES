/**
 * Basic chat support service — one thread per student.
 */
import type {
  AdminSupportConversation,
  SupportChatMessage,
  SupportChatThread,
  SupportConversation,
} from '@sharanam/shared';

import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';

const CONV_COLUMNS =
  'id, user_id, status, student_last_read_at, admin_last_read_at, admin_typing, admin_typing_at, last_message_at, last_message_preview, created_at, updated_at';

const MSG_COLUMNS =
  'id, conversation_id, sender_id, sender_role, body, created_at';

const TYPING_TTL_MS = 5000;

type ConvRow = {
  id: string;
  user_id: string;
  status: string;
  student_last_read_at: string | null;
  admin_last_read_at: string | null;
  admin_typing: boolean;
  admin_typing_at: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  created_at: string;
  updated_at: string;
};

type MsgRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: string;
  body: string;
  created_at: string;
};

function mapMessage(row: MsgRow): SupportChatMessage {
  return {
    id: row.id,
    conversation_id: row.conversation_id,
    sender_id: row.sender_id,
    sender_role: row.sender_role as 'student' | 'admin',
    body: row.body,
    created_at: row.created_at,
    from_support: row.sender_role === 'admin',
  };
}

function isTypingActive(row: ConvRow): boolean {
  if (!row.admin_typing || !row.admin_typing_at) return false;
  const age = Date.now() - new Date(row.admin_typing_at).getTime();
  return age >= 0 && age < TYPING_TTL_MS;
}

async function countUnreadForStudent(row: ConvRow): Promise<number> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('support_messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', row.id)
    .eq('sender_role', 'admin');

  if (row.student_last_read_at) {
    query = query.gt('created_at', row.student_last_read_at);
  }

  const { count, error } = await query;
  if (error) {
    throw new AppError(500, 'CHAT_UNREAD_FAILED', error.message);
  }
  return count ?? 0;
}

async function countUnreadForAdmin(row: ConvRow): Promise<number> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('support_messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', row.id)
    .eq('sender_role', 'student');

  if (row.admin_last_read_at) {
    query = query.gt('created_at', row.admin_last_read_at);
  }

  const { count, error } = await query;
  if (error) {
    throw new AppError(500, 'CHAT_UNREAD_FAILED', error.message);
  }
  return count ?? 0;
}

async function mapConversation(
  row: ConvRow,
  viewer: 'student' | 'admin',
): Promise<SupportConversation> {
  const unread =
    viewer === 'student'
      ? await countUnreadForStudent(row)
      : await countUnreadForAdmin(row);

  return {
    id: row.id,
    user_id: row.user_id,
    status: row.status as 'open' | 'closed',
    last_message_at: row.last_message_at,
    last_message_preview: row.last_message_preview,
    unread_count: unread,
    admin_typing: isTypingActive(row),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getOrCreateStudentConversation(
  userId: string,
): Promise<ConvRow> {
  const supabase = getSupabaseAdmin();
  const { data: existing, error } = await supabase
    .from('support_conversations')
    .select(CONV_COLUMNS)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'CHAT_FETCH_FAILED', error.message);
  }
  if (existing) return existing as ConvRow;

  const now = new Date().toISOString();
  const { data, error: insertError } = await supabase
    .from('support_conversations')
    .insert({
      user_id: userId,
      status: 'open',
      student_last_read_at: now,
      created_at: now,
      updated_at: now,
    })
    .select(CONV_COLUMNS)
    .single();

  if (insertError) {
    // Race: unique user_id — fetch again
    if (insertError.code === '23505') {
      return getOrCreateStudentConversation(userId);
    }
    throw new AppError(500, 'CHAT_CREATE_FAILED', insertError.message);
  }
  return data as ConvRow;
}

async function listMessages(conversationId: string): Promise<SupportChatMessage[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('support_messages')
    .select(MSG_COLUMNS)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(500);

  if (error) {
    throw new AppError(500, 'CHAT_MESSAGES_FAILED', error.message);
  }
  return ((data ?? []) as MsgRow[]).map(mapMessage);
}

export async function getStudentChatThread(
  userId: string,
): Promise<SupportChatThread> {
  const row = await getOrCreateStudentConversation(userId);
  const [conversation, messages] = await Promise.all([
    mapConversation(row, 'student'),
    listMessages(row.id),
  ]);
  return { conversation, messages };
}

export async function getStudentUnreadCount(userId: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('support_conversations')
    .select(CONV_COLUMNS)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'CHAT_FETCH_FAILED', error.message);
  }
  if (!data) return 0;
  return countUnreadForStudent(data as ConvRow);
}

export async function sendStudentMessage(
  userId: string,
  body: string,
): Promise<SupportChatMessage> {
  const conv = await getOrCreateStudentConversation(userId);
  if (conv.status === 'closed') {
    // Re-open on new student message
    const supabase = getSupabaseAdmin();
    await supabase
      .from('support_conversations')
      .update({ status: 'open', updated_at: new Date().toISOString() })
      .eq('id', conv.id);
  }

  return insertMessage({
    conversationId: conv.id,
    senderId: userId,
    senderRole: 'student',
    body,
  });
}

async function insertMessage(input: {
  conversationId: string;
  senderId: string;
  senderRole: 'student' | 'admin';
  body: string;
}): Promise<SupportChatMessage> {
  const text = input.body.trim();
  if (!text) {
    throw new AppError(400, 'EMPTY_MESSAGE', 'Message cannot be empty');
  }

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('support_messages')
    .insert({
      conversation_id: input.conversationId,
      sender_id: input.senderId,
      sender_role: input.senderRole,
      body: text,
      created_at: now,
    })
    .select(MSG_COLUMNS)
    .single();

  if (error) {
    throw new AppError(500, 'CHAT_SEND_FAILED', error.message);
  }

  const preview = text.length > 120 ? `${text.slice(0, 117)}…` : text;
  const readPatch =
    input.senderRole === 'student'
      ? { student_last_read_at: now }
      : { admin_last_read_at: now, admin_typing: false };

  await supabase
    .from('support_conversations')
    .update({
      last_message_at: now,
      last_message_preview: preview,
      updated_at: now,
      ...readPatch,
    })
    .eq('id', input.conversationId);

  return mapMessage(data as MsgRow);
}

export async function markStudentRead(userId: string): Promise<SupportConversation> {
  const conv = await getOrCreateStudentConversation(userId);
  const now = new Date().toISOString();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('support_conversations')
    .update({ student_last_read_at: now, updated_at: now })
    .eq('id', conv.id)
    .select(CONV_COLUMNS)
    .single();

  if (error) {
    throw new AppError(500, 'CHAT_READ_FAILED', error.message);
  }
  return mapConversation(data as ConvRow, 'student');
}

export async function listAdminConversations(): Promise<AdminSupportConversation[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('support_conversations')
    .select(CONV_COLUMNS)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(200);

  if (error) {
    throw new AppError(500, 'CHAT_FETCH_FAILED', error.message);
  }

  const rows = (data ?? []) as ConvRow[];
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const nameById = new Map<string, string>();
  const emailById = new Map<string, string>();

  if (userIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);
    for (const p of profiles ?? []) {
      nameById.set(p.id as string, ((p.full_name as string) || '').trim() || 'Student');
      emailById.set(p.id as string, (p.email as string) || '');
    }
  }

  const mapped = await Promise.all(
    rows.map(async (row) => {
      const base = await mapConversation(row, 'admin');
      return {
        ...base,
        student_name: nameById.get(row.user_id) ?? 'Student',
        student_email: emailById.get(row.user_id) ?? null,
      };
    }),
  );

  return mapped;
}

export async function getAdminChatThread(
  conversationId: string,
): Promise<SupportChatThread & { student_name: string; student_email: string | null }> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('support_conversations')
    .select(CONV_COLUMNS)
    .eq('id', conversationId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'CHAT_FETCH_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'CHAT_NOT_FOUND', 'Conversation not found');
  }

  const row = data as ConvRow;
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', row.user_id)
    .maybeSingle();

  const [conversation, messages] = await Promise.all([
    mapConversation(row, 'admin'),
    listMessages(row.id),
  ]);

  return {
    conversation,
    messages,
    student_name: ((profile?.full_name as string) || '').trim() || 'Student',
    student_email: (profile?.email as string) || null,
  };
}

export async function sendAdminMessage(
  conversationId: string,
  adminUserId: string,
  body: string,
): Promise<SupportChatMessage> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('support_conversations')
    .select('id')
    .eq('id', conversationId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'CHAT_FETCH_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'CHAT_NOT_FOUND', 'Conversation not found');
  }

  return insertMessage({
    conversationId,
    senderId: adminUserId,
    senderRole: 'admin',
    body,
  });
}

export async function markAdminRead(
  conversationId: string,
): Promise<SupportConversation> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('support_conversations')
    .update({ admin_last_read_at: now, updated_at: now })
    .eq('id', conversationId)
    .select(CONV_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'CHAT_READ_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'CHAT_NOT_FOUND', 'Conversation not found');
  }
  return mapConversation(data as ConvRow, 'admin');
}

export async function setAdminTyping(
  conversationId: string,
  typing: boolean,
): Promise<{ admin_typing: boolean }> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('support_conversations')
    .update({
      admin_typing: typing,
      admin_typing_at: typing ? now : null,
      updated_at: now,
    })
    .eq('id', conversationId)
    .select('admin_typing, admin_typing_at')
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'CHAT_TYPING_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'CHAT_NOT_FOUND', 'Conversation not found');
  }

  return {
    admin_typing: Boolean(data.admin_typing) && typing,
  };
}
