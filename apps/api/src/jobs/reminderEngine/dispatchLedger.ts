/**
 * Idempotent claim ledger for Reminder Engine.
 * Insert-first: unique (reminder_type, entity_id, reminder_key) prevents duplicates.
 */
import { getSupabaseAdmin } from '../../config/supabase';
import type { ReminderType } from './types';

export async function tryClaimReminder(input: {
  reminder_type: ReminderType;
  entity_type: string;
  entity_id: string;
  reminder_key: string;
  meta?: Record<string, unknown>;
}): Promise<{ claimed: boolean; dispatch_id: string | null }> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('reminder_dispatches')
    .insert({
      reminder_type: input.reminder_type,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      reminder_key: input.reminder_key,
      meta: input.meta ?? {},
    })
    .select('id')
    .maybeSingle();

  if (error) {
    // Unique violation → already sent
    if (error.code === '23505') {
      return { claimed: false, dispatch_id: null };
    }
    throw error;
  }

  if (!data?.id) {
    return { claimed: false, dispatch_id: null };
  }
  return { claimed: true, dispatch_id: data.id as string };
}

export async function attachNotificationToDispatch(
  dispatchId: string,
  notificationId: string,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase
    .from('reminder_dispatches')
    .update({ notification_id: notificationId })
    .eq('id', dispatchId);
}
