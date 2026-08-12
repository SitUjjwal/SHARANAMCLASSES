/**
 * Environment validation — fail fast on unsafe / incomplete production config.
 */
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Accept common alternate names from host/panel templates.
 * Canonical names always win if both are set.
 */
function applyEnvAliases(): void {
  const aliases: Array<[from: string, to: string]> = [
    ['RAZORPAY_KEY', 'RAZORPAY_KEY_ID'],
    ['RAZORPAY_SECRET', 'RAZORPAY_KEY_SECRET'],
    ['CLOUDFLARE_ACCOUNT_ID', 'R2_ACCOUNT_ID'],
    ['CLOUDFLARE_ACCESS_KEY', 'R2_ACCESS_KEY_ID'],
    ['CLOUDFLARE_SECRET_KEY', 'R2_SECRET_ACCESS_KEY'],
    ['FCM_SERVICE_ACCOUNT_JSON', 'FIREBASE_SERVICE_ACCOUNT_JSON'],
    ['FCM_SERVICE_ACCOUNT_PATH', 'FIREBASE_SERVICE_ACCOUNT_PATH'],
  ];

  for (const [from, to] of aliases) {
    const src = process.env[from]?.trim();
    if (src && !process.env[to]?.trim()) {
      process.env[to] = src;
    }
  }
}

applyEnvAliases();

const envSchema = z.object({
  /**
   * Node runtime mode (tooling / Express optimizations).
   * Staging and production both typically use `production` here.
   */
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  /**
   * Deployment tier — independent of NODE_ENV.
   * development | staging | production
   */
  APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  /** Max time to drain HTTP + stop jobs on SIGTERM/SIGINT */
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  API_BASE_URL: z.string().url().default('http://localhost:4000'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173,http://localhost:8081')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    )
    .refine((origins) => origins.length > 0, 'CORS_ORIGINS must list at least one origin'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  /**
   * Comma-separated emails treated as admin (and auto-promoted in profiles).
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
  /** Reserved for non-Supabase signed tokens if added later — must not be default in prod */
  JWT_SECRET: z.string().min(16).default('dev-only-change-me'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  /** Project URL only — e.g. https://xxxx.supabase.co (never paste a JWT here) */
  SUPABASE_URL: z.string().default(''),
  /** Server-only key — never ship to mobile/admin */
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(''),
  /** Optional public anon key (not used for admin client) */
  SUPABASE_ANON_KEY: z.string().default(''),
  R2_ACCOUNT_ID: z.string().default(''),
  R2_ACCESS_KEY_ID: z.string().default(''),
  R2_SECRET_ACCESS_KEY: z.string().default(''),
  R2_BUCKET: z.string().default(''),
  R2_PUBLIC_BASE_URL: z.string().default(''),
  R2_ENDPOINT: z.string().default(''),
  /** Signed GetObject URL lifetime (seconds). Default 1 hour. */
  R2_SIGNED_URL_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
  RAZORPAY_KEY_ID: z.string().default(''),
  RAZORPAY_KEY_SECRET: z.string().default(''),
  RAZORPAY_WEBHOOK_SECRET: z.string().default(''),
  REMINDER_ENGINE_ENABLED: z.string().optional(),
  REMINDER_ENGINE_CRON: z.string().default('*/15 * * * *'),
  REMINDER_ENGINE_TZ: z.string().default('Asia/Kolkata'),
  REMINDER_LIVE_LEAD_MINUTES: z.coerce.number().default(60),
  REMINDER_LIVE_WINDOW_MINUTES: z.coerce.number().default(12),
  REMINDER_EXPIRY_DAYS: z.string().default('7,3,1'),
  REMINDER_CHAPTER_LOOKBACK_HOURS: z.coerce.number().default(36),
  REMINDER_MISSED_LOOKBACK_HOURS: z.coerce.number().default(3),
  /** Backup engine (Module 12) */
  BACKUP_ENGINE_ENABLED: z.string().optional(),
  BACKUP_ENGINE_CRON: z.string().default('0 2 * * *'),
  BACKUP_ENGINE_TZ: z.string().default('Asia/Kolkata'),
  BACKUP_RETAIN_DAYS: z.coerce.number().int().positive().default(30),
  /** Logging */
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOG_DIR: z.string().default('logs'),
  LOG_MAX_FILES: z.coerce.number().int().positive().default(14),
  LOG_MAX_SIZE: z.string().default('20M'),
  LOG_TO_CONSOLE: z
    .string()
    .optional()
    .transform((v) => {
      if (v === undefined || v === '') return undefined;
      return v === '1' || v.toLowerCase() === 'true';
    }),
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

/** True for staging or production deployment tiers (strict secret checks). */
export function isDeployedTier(): boolean {
  return env.APP_ENV === 'staging' || env.APP_ENV === 'production';
}

/**
 * Fail fast when secrets are missing/invalid on staging/production.
 * Also when NODE_ENV=production (covers hosts that omit APP_ENV).
 */
function assertDeployedSecrets(): void {
  const strict =
    env.APP_ENV === 'staging' ||
    env.APP_ENV === 'production' ||
    env.NODE_ENV === 'production';
  if (!strict) return;

  const missing: string[] = [];
  const tierLabel = env.APP_ENV !== 'development' ? env.APP_ENV : env.NODE_ENV;

  if (!env.SUPABASE_URL.startsWith('https://') || !env.SUPABASE_URL.includes('supabase.co')) {
    missing.push('SUPABASE_URL (https://<ref>.supabase.co)');
  }
  if (!env.SUPABASE_SERVICE_ROLE_KEY.trim()) {
    missing.push('SUPABASE_SERVICE_ROLE_KEY');
  }
  if (env.JWT_SECRET === 'dev-only-change-me' || env.JWT_SECRET.length < 32) {
    missing.push('JWT_SECRET (min 32 chars, not the default)');
  }
  if (env.APP_ENV === 'production' && env.CORS_ORIGINS.some((o) => o.includes('localhost'))) {
    console.warn('[api] WARNING: CORS_ORIGINS includes localhost in production');
  }
  if (!isR2Configured()) {
    missing.push(
      'Cloudflare R2 (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL)',
    );
  }
  if (!isRazorpayEnvConfigured()) {
    missing.push('RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET');
  }

  if (missing.length) {
    console.error(
      `[api] ${tierLabel} security check failed. Missing/invalid:`,
      missing.join('; '),
    );
    process.exit(1);
  }
}

assertDeployedSecrets();
