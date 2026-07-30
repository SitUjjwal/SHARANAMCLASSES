/**
 * Process entrypoint.
 * Why: Node needs one file to start the HTTP server.
 * Future: production runs the compiled `dist/server.js` the same way.
 */
import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`[api] SHARANAM CLASSES listening on :${env.PORT} (${env.NODE_ENV})`);
});
