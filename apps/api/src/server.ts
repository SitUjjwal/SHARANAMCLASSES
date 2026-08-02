/**
 * Process entrypoint.
 * Why: Node needs one file to start the HTTP server.
 * Future: production runs the compiled `dist/server.js` the same way.
 */
import { createApp } from './app';
import { env } from './config/env';
import { registerDomainEventHandlers } from './events/register';
import { startReminderScheduler } from './jobs/reminderEngine/scheduler';

registerDomainEventHandlers();

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`[api] SHARANAM CLASSES listening on :${env.PORT} (${env.NODE_ENV})`);
  startReminderScheduler();
});
