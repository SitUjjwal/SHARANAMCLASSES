/**
 * New Chapters — notify course enrollees when a chapter was recently published.
 */
import { createAndMaybeSendNotification } from '../../../services/notification.service';
import { getSupabaseAdmin } from '../../../config/supabase';
import { attachNotificationToDispatch, tryClaimReminder } from '../dispatchLedger';
import type { ReminderEngineConfig, ReminderHandlerResult } from '../types';

export async function runNewChapter(
  config: ReminderEngineConfig,
  opts: { dryRun: boolean },
): Promise<ReminderHandlerResult> {
  const result: ReminderHandlerResult = {
    reminder_type: 'new_chapter',
    scanned: 0,
    claimed: 0,
    sent: 0,
    skipped: 0,
    errors: [],
  };

  const since = new Date(
    Date.now() - config.chapterLookbackHours * 60 * 60 * 1000,
  ).toISOString();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('chapters')
    .select('id, title, course_id, is_published, created_at, courses(title)')
    .eq('is_published', true)
    .gte('created_at', since);

  if (error) {
    result.errors.push(error.message);
    return result;
  }

  const rows = data ?? [];
  result.scanned = rows.length;

  for (const row of rows) {
    const entityId = row.id as string;
    const courseId = row.course_id as string;
    const courseTitle =
      (row.courses as { title?: string } | null)?.title ?? 'your course';

    if (opts.dryRun) {
      result.skipped += 1;
      continue;
    }

    try {
      const claim = await tryClaimReminder({
        reminder_type: 'new_chapter',
        entity_type: 'chapter',
        entity_id: entityId,
        reminder_key: 'published',
        meta: { course_id: courseId, created_at: row.created_at },
      });
      if (!claim.claimed || !claim.dispatch_id) {
        result.skipped += 1;
        continue;
      }
      result.claimed += 1;

      const notification = await createAndMaybeSendNotification(
        {
          title: 'New chapter available',
          body: `${row.title as string} was added to ${courseTitle}.`,
          deep_link: `sharanam://course/${courseId}`,
          data: {
            type: 'chapter',
            chapter_id: entityId,
            course_id: courseId,
          },
          notification_type: 'course_update',
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
