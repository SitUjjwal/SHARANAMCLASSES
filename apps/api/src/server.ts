/**
 * Process entrypoint — boots HTTP server.
 */
import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[api] listening on :${env.PORT} (${env.NODE_ENV})`);
});
