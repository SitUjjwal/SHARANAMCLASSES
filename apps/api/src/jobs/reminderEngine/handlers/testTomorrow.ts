/**
 * Tomorrow's Tests — day-before reminder for published tests with scheduled_at.
 */
import { createAndMaybeSendNotification } from '../../../services/notification.service';
import { getSupabaseAdmin } from '../../../config/supabase';
import { attachNotificationToDispatch, tryClaimReminder } from '../dispatchLedger';
import { addDays, calendarDateInTz } from '../time';
import type { ReminderEngineConfig, ReminderHandlerResult } from '../types';

export async function runTestTomorrow(
  config: ReminderEngineConfig,
  opts: { dryRun: boolean },
): Promise<ReminderHandlerResult> {
  const result: ReminderHandlerResult = {
    reminder_type: 'test_tomorrow',
    scanned: 0,
    claimed: 0,
    sent: 0,
    skipped: 0,
    errors: [],
  };

  const now = new Date();
  const tomorrowDate = calendarDateInTz(addDays(now, 1), config.timezone);

  const supabase = getSupabaseAdmin();
  // Broad fetch: scheduled within next ~48h, filter by calendar tomorrow in TZ
  const rangeStart = addDays(now, -1);
  const rangeEnd = addDays(now, 3);

  const { data, error } = await supabase
    .from('tests')
    .select('id, title, course_id, scheduled_at, is_published')
    .eq('is_published', true)
    .not('scheduled_at', 'is', null)
    .gte('scheduled_at', rangeStart.toISOString())
    .lte('scheduled_at', rangeEnd.toISOString());

  if (error) {
    result.errors.push(error.message);
    return result;
  }

  const rows = (data ?? []).filter((row) => {
    const scheduled = row.scheduled_at as string;
    return calendarDateInTz(new Date(scheduled), config.timezone) === tomorrowDate;
  });
  result.scanned = rows.length;

  for (const row of rows) {
    const entityId = row.id as string;
    const reminderKey = `day_before:${tomorrowDate}`;

    if (opts.dryRun) {
      result.skipped += 1;
      continue;
    }

    try {
      const claim = await tryClaimReminder({
        reminder_type: 'test_tomorrow',
        entity_type: 'test',
        entity_id: entityId,
        reminder_key: reminderKey,
        meta: { scheduled_at: row.scheduled_at },
      });
      if (!claim.claimed || !claim.dispatch_id) {
        result.skipped += 1;
        continue;
      }
      result.claimed += 1;

      const courseId = row.course_id as string | null;
      const notification = await createAndMaybeSendNotification(
        {
          title: "Tomorrow's test",
          body: `${row.title as string} is scheduled for tomorrow. Be ready!`,
          deep_link: `sharanam://test/${entityId}`,
          data: {
            type: 'test',
            test_id: entityId,
            ...(courseId ? { course_id: courseId } : {}),
          },
          notification_type: 'test_reminder',
          audience_type: courseId ? 'course' : 'all_users',
          audience_course_id: courseId ?? undefined,
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
