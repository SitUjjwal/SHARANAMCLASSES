import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`[api] SHARANAM CLASSES listening on :${env.PORT} (${env.NODE_ENV})`);
});
