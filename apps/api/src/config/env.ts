import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  API_BASE_URL: z.string().default('http://localhost:4000'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173,http://localhost:8081')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  JWT_SECRET: z.string().default('dev-only-change-me'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  /** Project URL only — e.g. https://xxxx.supabase.co (never paste a JWT here) */
  SUPABASE_URL: z.string().default(''),
  /** Server-only key — never ship to mobile/admin */
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(''),
  /** Optional public anon key (not used for admin client) */
  SUPABASE_ANON_KEY: z.string().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('[api] Invalid environment configuration', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
