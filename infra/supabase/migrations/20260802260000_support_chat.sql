-- Basic Chat Support — one conversation per student + messages + read/typing flags

create table if not exists public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'open'
    check (status in ('open', 'closed')),
  student_last_read_at timestamptz,
  admin_last_read_at timestamptz,
  admin_typing boolean not null default false,
  admin_typing_at timestamptz,
  last_message_at timestamptz,
  last_message_preview text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_conversations_user_unique unique (user_id)
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null
    references public.support_conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  sender_role text not null check (sender_role in ('student', 'admin')),
  body text not null,
  created_at timestamptz not null default now(),
  constraint support_messages_body_len check (char_length(trim(body)) >= 1)
);

create index if not exists support_messages_conversation_idx
  on public.support_messages (conversation_id, created_at asc);

create index if not exists support_conversations_admin_idx
  on public.support_conversations (last_message_at desc nulls last);

alter table public.support_conversations enable row level security;
alter table public.support_messages enable row level security;

drop policy if exists "support_conversations_deny_all" on public.support_conversations;
create policy "support_conversations_deny_all"
  on public.support_conversations for all using (false) with check (false);

drop policy if exists "support_messages_deny_all" on public.support_messages;
create policy "support_messages_deny_all"
  on public.support_messages for all using (false) with check (false);

comment on table public.support_conversations is
  'One support chat thread per student; typing + read cursors for basic chat UX';
comment on table public.support_messages is
  'Chat messages in a support conversation (student or admin)';
