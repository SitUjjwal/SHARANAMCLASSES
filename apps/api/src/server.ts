/**
 * Process entrypoint.
 * Why: Node needs one file to start the HTTP server.
 * Future: production runs the compiled `dist/server.js` the same way.
 */
import type { Server } from 'node:http';

import { createApp } from './app';
import { env } from './config/env';
import { markShuttingDown } from './config/lifecycle';
import { registerDomainEventHandlers } from './events/register';
import { startBackupScheduler, stopBackupScheduler } from './jobs/backupEngine/scheduler';
import {
  startReminderScheduler,
  stopReminderScheduler,
} from './jobs/reminderEngine/scheduler';
import { closeLogger, initLogger, logger } from './logging';
import { startMonitoringSampler, stopMonitoringSampler } from './monitoring';

initLogger();
registerDomainEventHandlers();

const app = createApp();

const server: Server = app.listen(env.PORT, () => {
  logger.info(`SHARANAM CLASSES listening on :${env.PORT}`, {
    port: env.PORT,
    node_env: env.NODE_ENV,
    app_env: env.APP_ENV,
    log_dir: logger.getLogDir(),
  });
  startReminderScheduler();
  startBackupScheduler();
  startMonitoringSampler();
});

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  markShuttingDown();

  logger.info('Graceful shutdown started', { signal, timeout_ms: env.SHUTDOWN_TIMEOUT_MS });

  stopReminderScheduler();
  stopBackupScheduler();
  stopMonitoringSampler();

  const forceTimer = setTimeout(() => {
    logger.error('Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, env.SHUTDOWN_TIMEOUT_MS);
  forceTimer.unref();

  await new Promise<void>((resolve) => {
    server.close((err) => {
      if (err) {
        logger.error('HTTP server close error', { error: String(err) });
      } else {
        logger.info('HTTP server closed');
      }
      resolve();
    });
  });

  await closeLogger();
  clearTimeout(forceTimer);
  process.exit(0);
}

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void shutdown('SIGINT');
});
