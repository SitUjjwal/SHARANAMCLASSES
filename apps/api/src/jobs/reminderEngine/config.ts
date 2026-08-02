/**
 * Reminder Engine config from env.
 */
import { env } from '../../config/env';
import type { ReminderEngineConfig } from './types';

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  const v = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(v)) return true;
  if (['0', 'false', 'no', 'off'].includes(v)) return false;
  return fallback;
}

function parseIntList(value: string | undefined, fallback: number[]): number[] {
  if (!value?.trim()) return fallback;
  const parts = value
    .split(',')
    .map((p) => Number.parseInt(p.trim(), 10))
    .filter((n) => Number.isFinite(n) && n >= 0);
  return parts.length ? parts : fallback;
}

export function getReminderEngineConfig(): ReminderEngineConfig {
  return {
    enabled: parseBool(env.REMINDER_ENGINE_ENABLED, env.NODE_ENV !== 'test'),
    cron: env.REMINDER_ENGINE_CRON || '*/15 * * * *',
    timezone: env.REMINDER_ENGINE_TZ || 'Asia/Kolkata',
    liveLeadMinutes: env.REMINDER_LIVE_LEAD_MINUTES,
    liveWindowMinutes: env.REMINDER_LIVE_WINDOW_MINUTES,
    expiryDays: parseIntList(env.REMINDER_EXPIRY_DAYS, [7, 3, 1]),
    chapterLookbackHours: env.REMINDER_CHAPTER_LOOKBACK_HOURS,
    missedLookbackHours: env.REMINDER_MISSED_LOOKBACK_HOURS,
  };
}
