/**
 * node-cron bootstrap for Reminder Engine.
 */
import cron, { type ScheduledTask } from 'node-cron';

import { getReminderEngineConfig } from './config';
import { runReminderTick } from './runTick';

let task: ScheduledTask | null = null;

export function startReminderScheduler(): void {
  const config = getReminderEngineConfig();
  if (!config.enabled) {
    console.log('[reminder-engine] disabled (REMINDER_ENGINE_ENABLED=false)');
    return;
  }

  if (!cron.validate(config.cron)) {
    console.error(`[reminder-engine] invalid cron expression: ${config.cron}`);
    return;
  }

  if (task) {
    task.stop();
    task = null;
  }

  task = cron.schedule(
    config.cron,
    () => {
      void runReminderTick({ dryRun: false, config })
        .then((result) => {
          if (result.skipped_overlap) {
            console.warn('[reminder-engine] tick skipped (overlap)');
            return;
          }
          const summary = result.handlers
            .map((h) => `${h.reminder_type}:sent=${h.sent}/scanned=${h.scanned}`)
            .join(' | ');
          console.log(`[reminder-engine] tick ok — ${summary}`);
          for (const h of result.handlers) {
            for (const err of h.errors) {
              console.warn(`[reminder-engine] ${h.reminder_type}: ${err}`);
            }
          }
        })
        .catch((err) => {
          console.error(
            '[reminder-engine] tick failed',
            err instanceof Error ? err.message : err,
          );
        });
    },
    { timezone: config.timezone },
  );

  console.log(
    `[reminder-engine] scheduled "${config.cron}" tz=${config.timezone}`,
  );
}

export function stopReminderScheduler(): void {
  if (task) {
    task.stop();
    task = null;
  }
}
