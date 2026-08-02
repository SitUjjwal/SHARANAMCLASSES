/**
 * Missed Classes — soft reminder after a live class ends (no attendance table yet).
 * Fans out to course enrollments: "You may have missed …".
 */
import { createAndMaybeSendNotification } from '../../../services/notification.service';
import { getSupabaseAdmin } from '../../../config/supabase';
import { attachNotificationToDispatch, tryClaimReminder } from '../dispatchLedger';
import type { ReminderEngineConfig, ReminderHandlerResult } from '../types';

export async function runMissedClass(
  config: ReminderEngineConfig,
  opts: { dryRun: boolean },
): Promise<ReminderHandlerResult> {
  const result: ReminderHandlerResult = {
    reminder_type: 'missed_class',
    scanned: 0,
    claimed: 0,
    sent: 0,
    skipped: 0,
    errors: [],
  };

  const now = Date.now();
  const lookbackStart = new Date(
    now - config.missedLookbackHours * 60 * 60 * 1000,
  ).toISOString();
  // Grace: wait 10 minutes after end before reminding
  const graceEnd = new Date(now - 10 * 60_000).toISOString();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('live_classes')
    .select('id, title, course_id, end_time, is_published')
    .eq('is_published', true)
    .not('course_id', 'is', null)
    .gte('end_time', lookbackStart)
    .lte('end_time', graceEnd);

  if (error) {
    result.errors.push(error.message);
    return result;
  }

  const rows = data ?? [];
  result.scanned = rows.length;

  for (const row of rows) {
    const entityId = row.id as string;
    const courseId = row.course_id as string;

    if (opts.dryRun) {
      result.skipped += 1;
      continue;
    }

    try {
      const claim = await tryClaimReminder({
        reminder_type: 'missed_class',
        entity_type: 'live_class',
        entity_id: entityId,
        reminder_key: 'ended',
        meta: { end_time: row.end_time, course_id: courseId },
      });
      if (!claim.claimed || !claim.dispatch_id) {
        result.skipped += 1;
        continue;
      }
      result.claimed += 1;

      const notification = await createAndMaybeSendNotification(
        {
          title: 'Missed a live class?',
          body: `${row.title as string} has ended. Catch the recording if available.`,
          deep_link: `sharanam://live/${entityId}`,
          data: {
            type: 'missed_class',
            live_class_id: entityId,
            course_id: courseId,
          },
          notification_type: 'missed_class',
          audience_type: 'course',
          audience_course_id: courseId,
          send: true,
        },
        null,
      );

      await attachNotificationToDispatch(claim.dispatch_id, notification.id);
      result.sent += 1;
    } catch (err) {
      result.errors.push(
        `${entityId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return result;
}
