/**
 * Backup engine scheduler — nightly (or configured) cron → runBackup.
 */
import cron, { type ScheduledTask } from 'node-cron';

import { getBackupEngineConfig, runBackup } from '../../services/backup.service';
import { logger } from '../../logging/logger';

let task: ScheduledTask | null = null;

export function startBackupScheduler(): void {
  const config = getBackupEngineConfig();
  if (!config.enabled) {
    logger.info('Backup engine disabled (BACKUP_ENGINE_ENABLED=false)', {}, 'system');
    return;
  }

  if (!cron.validate(config.cron)) {
    logger.warn(`Backup engine invalid cron: ${config.cron}`, {}, 'system');
    return;
  }

  if (task) {
    task.stop();
    task = null;
  }

  task = cron.schedule(
    config.cron,
    () => {
      void runBackup({ trigger: 'cron' })
        .then((run) => {
          logger.info('Scheduled backup finished', {
            run_id: run.id,
            status: run.status,
            byte_size: run.byte_size,
          }, 'system');
        })
        .catch((err) => {
          logger.warn(
            'Scheduled backup failed',
            { message: err instanceof Error ? err.message : String(err) },
            'system',
          );
        });
    },
    { timezone: config.timezone },
  );

  logger.info(
    `Backup engine scheduled "${config.cron}" tz=${config.timezone}`,
    {},
    'system',
  );
}

export function stopBackupScheduler(): void {
  if (task) {
    task.stop();
    task = null;
  }
}
