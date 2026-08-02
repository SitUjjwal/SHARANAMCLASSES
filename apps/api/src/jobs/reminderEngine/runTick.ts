/**
 * One Reminder Engine tick — runs all five handlers sequentially.
 * Overlapping ticks are skipped via an in-process mutex.
 */
import { getReminderEngineConfig } from './config';
import { runCourseExpiry } from './handlers/courseExpiry';
import { runLiveClassUpcoming } from './handlers/liveClassUpcoming';
import { runMissedClass } from './handlers/missedClass';
import { runNewChapter } from './handlers/newChapter';
import { runTestTomorrow } from './handlers/testTomorrow';
import type { ReminderEngineConfig, ReminderTickResult } from './types';

let tickInFlight = false;

export async function runReminderTick(opts?: {
  dryRun?: boolean;
  config?: ReminderEngineConfig;
}): Promise<ReminderTickResult & { skipped_overlap?: boolean }> {
  const dryRun = opts?.dryRun === true;
  const config = opts?.config ?? getReminderEngineConfig();
  const started_at = new Date().toISOString();

  if (tickInFlight) {
    return {
      started_at,
      finished_at: new Date().toISOString(),
      dry_run: dryRun,
      handlers: [],
      skipped_overlap: true,
    };
  }

  tickInFlight = true;
  try {
    const handlers = [
      await runLiveClassUpcoming(config, { dryRun }),
      await runTestTomorrow(config, { dryRun }),
      await runCourseExpiry(config, { dryRun }),
      await runNewChapter(config, { dryRun }),
      await runMissedClass(config, { dryRun }),
    ];

    return {
      started_at,
      finished_at: new Date().toISOString(),
      dry_run: dryRun,
      handlers,
    };
  } finally {
    tickInFlight = false;
  }
}
