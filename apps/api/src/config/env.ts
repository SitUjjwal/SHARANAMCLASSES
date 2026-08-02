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
  /**
   * Comma-separated emails treated as admin (and auto-promoted in profiles).
   * Example: ujjwalsharan82@gmail.com
   */
  ADMIN_EMAILS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  JWT_SECRET: z.string().default('dev-only-change-me'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  /** Project URL only — e.g. https://xxxx.supabase.co (never paste a JWT here) */
  SUPABASE_URL: z.string().default(''),
  /** Server-only key — never ship to mobile/admin */
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(''),
  /** Optional public anon key (not used for admin client) */
  SUPABASE_ANON_KEY: z.string().default(''),
  /**
   * Cloudflare R2 (S3-compatible) — required in production for PDF uploads.
   * Leave blank in local/dev to fall back to Supabase chapter-materials.
   */
  R2_ACCOUNT_ID: z.string().default(''),
  R2_ACCESS_KEY_ID: z.string().default(''),
  R2_SECRET_ACCESS_KEY: z.string().default(''),
  R2_BUCKET: z.string().default(''),
  /** Public base URL (custom domain or r2.dev) — no trailing slash */
  R2_PUBLIC_BASE_URL: z.string().default(''),
  /** Optional override; default https://{accountId}.r2.cloudflarestorage.com */
  R2_ENDPOINT: z.string().default(''),
  /**
   * Razorpay Payment Gateway (server-only secret).
   * Checkout receives KEY_ID only — never ship KEY_SECRET to clients.
   */
  RAZORPAY_KEY_ID: z.string().default(''),
  RAZORPAY_KEY_SECRET: z.string().default(''),
  /** Optional — required only if webhook route is enabled */
  RAZORPAY_WEBHOOK_SECRET: z.string().default(''),
  /**
   * Reminder Engine (node-cron scheduled notification jobs).
   * Default enabled outside test; set REMINDER_ENGINE_ENABLED=false to disable.
   */
  REMINDER_ENGINE_ENABLED: z.string().optional(),
  /** Cron expression (default every 15 minutes) */
  REMINDER_ENGINE_CRON: z.string().default('*/15 * * * *'),
  REMINDER_ENGINE_TZ: z.string().default('Asia/Kolkata'),
  REMINDER_LIVE_LEAD_MINUTES: z.coerce.number().default(60),
  REMINDER_LIVE_WINDOW_MINUTES: z.coerce.number().default(12),
  /** Comma-separated day milestones before course expiry */
  REMINDER_EXPIRY_DAYS: z.string().default('7,3,1'),
  REMINDER_CHAPTER_LOOKBACK_HOURS: z.coerce.number().default(36),
  REMINDER_MISSED_LOOKBACK_HOURS: z.coerce.number().default(3),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('[api] Invalid environment configuration', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export function isR2Configured(): boolean {
  return Boolean(
    env.R2_ACCOUNT_ID &&
      env.R2_ACCESS_KEY_ID &&
      env.R2_SECRET_ACCESS_KEY &&
      env.R2_BUCKET &&
      env.R2_PUBLIC_BASE_URL,
  );
}

export function isRazorpayEnvConfigured(): boolean {
  return Boolean(env.RAZORPAY_KEY_ID?.trim() && env.RAZORPAY_KEY_SECRET?.trim());
}

if (env.NODE_ENV === 'production' && !isR2Configured()) {
  console.error(
    '[api] Cloudflare R2 is required in production (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL)',
  );
  process.exit(1);
}

if (env.NODE_ENV === 'production' && !isRazorpayEnvConfigured()) {
  console.error(
    '[api] Razorpay is required in production (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)',
  );
  process.exit(1);
}
