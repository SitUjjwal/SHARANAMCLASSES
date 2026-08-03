/**
 * Archive ended live classes onto their linked course as recordings.
 */
import { archiveEndedLiveClasses } from '../../../services/archiveEndedLive.service';
import type { ReminderEngineConfig, ReminderHandlerResult } from '../types';

export async function runArchiveEndedLive(
  _config: ReminderEngineConfig,
  opts: { dryRun: boolean },
): Promise<ReminderHandlerResult> {
  const result: ReminderHandlerResult = {
    reminder_type: 'archive_ended_live',
    scanned: 0,
    claimed: 0,
    sent: 0,
    skipped: 0,
    errors: [],
  };

  if (opts.dryRun) {
    result.skipped += 1;
    return result;
  }

  const outcome = await archiveEndedLiveClasses(25);
  result.scanned = outcome.scanned;
  result.claimed = outcome.archived;
  result.sent = outcome.archived;
  result.skipped = outcome.skipped;
  result.errors = outcome.errors;
  return result;
}
