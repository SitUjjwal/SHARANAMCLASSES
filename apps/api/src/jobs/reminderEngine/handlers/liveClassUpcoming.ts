/**
 * Upcoming Live Classes — notify ~1h before start (course enrollments or all users).
 */
import { createAndMaybeSendNotification } from '../../../services/notification.service';
import { getSupabaseAdmin } from '../../../config/supabase';
import { attachNotificationToDispatch, tryClaimReminder } from '../dispatchLedger';
import { iso } from '../time';
import type { ReminderEngineConfig, ReminderHandlerResult } from '../types';

export async function runLiveClassUpcoming(
  config: ReminderEngineConfig,
  opts: { dryRun: boolean },
): Promise<ReminderHandlerResult> {
  const result: ReminderHandlerResult = {
    reminder_type: 'live_class_upcoming',
    scanned: 0,
    claimed: 0,
    sent: 0,
    skipped: 0,
    errors: [],
  };

  const now = Date.now();
  const leadMs = config.liveLeadMinutes * 60_000;
  const half = config.liveWindowMinutes * 60_000;
  const windowStart = new Date(now + leadMs - half);
  const windowEnd = new Date(now + leadMs + half);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('live_classes')
    .select('id, title, course_id, start_time, end_time, is_published')
    .eq('is_published', true)
    .gte('start_time', iso(windowStart))
    .lte('start_time', iso(windowEnd));

  if (error) {
    result.errors.push(error.message);
    return result;
  }

  const rows = data ?? [];
  result.scanned = rows.length;

  for (const row of rows) {
    const entityId = row.id as string;
    const reminderKey = `t-${config.liveLeadMinutes}m`;

    if (opts.dryRun) {
      result.skipped += 1;
      continue;
    }

    try {
      const claim = await tryClaimReminder({
        reminder_type: 'live_class_upcoming',
        entity_type: 'live_class',
        entity_id: entityId,
        reminder_key: reminderKey,
        meta: { start_time: row.start_time },
      });
      if (!claim.claimed || !claim.dispatch_id) {
        result.skipped += 1;
        continue;
      }
      result.claimed += 1;

      const courseId = row.course_id as string | null;
      const notification = await createAndMaybeSendNotification(
        {
          title: 'Live class starting soon',
          body: `${row.title as string} starts in about ${config.liveLeadMinutes} minutes.`,
          deep_link: `sharanam://live/${entityId}`,
          data: {
            type: 'live_class',
            live_class_id: entityId,
            ...(courseId ? { course_id: courseId } : {}),
          },
          notification_type: 'live_class',
          audience_type: courseId ? 'course' : 'all_users',
          audience_course_id: courseId ?? undefined,
          send: true,
        },
        null,
      );

      await attachNotificationToDispatch(claim.dispatch_id, notification.id);
      await supabase
        .from('live_classes')
        .update({ notification_sent_at: new Date().toISOString() })
        .eq('id', entityId)
        .is('notification_sent_at', null);

      result.sent += 1;
    } catch (err) {
      result.errors.push(
        `${entityId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return result;
}
