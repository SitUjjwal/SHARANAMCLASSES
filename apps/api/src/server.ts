/**
 * Process entrypoint.
 * Why: Node needs one file to start the HTTP server.
 * Future: production runs the compiled `dist/server.js` the same way.
 */
import { createApp } from './app';
import { env } from './config/env';
import { registerDomainEventHandlers } from './events/register';
import { startBackupScheduler } from './jobs/backupEngine/scheduler';
import { startReminderScheduler } from './jobs/reminderEngine/scheduler';
import { initLogger, logger } from './logging';
import { startMonitoringSampler } from './monitoring';

initLogger();
registerDomainEventHandlers();

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(`SHARANAM CLASSES listening on :${env.PORT}`, {
    port: env.PORT,
    node_env: env.NODE_ENV,
    log_dir: logger.getLogDir(),
  });
  startReminderScheduler();
  startBackupScheduler();
  startMonitoringSampler();
});
