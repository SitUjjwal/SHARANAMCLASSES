/**
 * Course Expiry — warn buyers N days before purchased_courses.expires_at.
 */
import { createAndMaybeSendNotification } from '../../../services/notification.service';
import { getSupabaseAdmin } from '../../../config/supabase';
import { attachNotificationToDispatch, tryClaimReminder } from '../dispatchLedger';
import { addDays, calendarDateInTz } from '../time';
import type { ReminderEngineConfig, ReminderHandlerResult } from '../types';

export async function runCourseExpiry(
  config: ReminderEngineConfig,
  opts: { dryRun: boolean },
): Promise<ReminderHandlerResult> {
  const result: ReminderHandlerResult = {
    reminder_type: 'course_expiry',
    scanned: 0,
    claimed: 0,
    sent: 0,
    skipped: 0,
    errors: [],
  };

  const now = new Date();
  const maxDays = Math.max(...config.expiryDays, 0);
  const rangeEnd = addDays(now, maxDays + 1);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('purchased_courses')
    .select('id, user_id, course_id, expires_at, courses(title)')
    .not('expires_at', 'is', null)
    .gte('expires_at', now.toISOString())
    .lte('expires_at', rangeEnd.toISOString());

  if (error) {
    result.errors.push(error.message);
    return result;
  }

  const rows = data ?? [];
  result.scanned = rows.length;

  const targetDates = new Map<string, number>();
  for (const days of config.expiryDays) {
    targetDates.set(calendarDateInTz(addDays(now, days), config.timezone), days);
  }

  for (const row of rows) {
    const expiresAt = row.expires_at as string;
    const expiryDate = calendarDateInTz(new Date(expiresAt), config.timezone);
    const daysBefore = targetDates.get(expiryDate);
    if (daysBefore === undefined) {
      result.skipped += 1;
      continue;
    }

    const entityId = row.id as string;
    const reminderKey = `d-${daysBefore}`;
    const courseTitle =
      (row.courses as { title?: string } | null)?.title ?? 'Your course';

    if (opts.dryRun) {
      result.skipped += 1;
      continue;
    }

    try {
      const claim = await tryClaimReminder({
        reminder_type: 'course_expiry',
        entity_type: 'purchased_course',
        entity_id: entityId,
        reminder_key: reminderKey,
        meta: { expires_at: expiresAt, days_before: daysBefore },
      });
      if (!claim.claimed || !claim.dispatch_id) {
        result.skipped += 1;
        continue;
      }
      result.claimed += 1;

      const userId = row.user_id as string;
      const courseId = row.course_id as string;
      const dayLabel = daysBefore === 1 ? 'tomorrow' : `in ${daysBefore} days`;

      const notification = await createAndMaybeSendNotification(
        {
          title: 'Course access expiring soon',
          body: `${courseTitle} access expires ${dayLabel}. Renew to keep learning.`,
          deep_link: `sharanam://course/${courseId}`,
          data: {
            type: 'course_expiry',
            course_id: courseId,
            purchased_course_id: entityId,
            days_before: String(daysBefore),
          },
          notification_type: 'course_expiry',
          audience_type: 'single_user',
          audience_user_id: userId,
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
