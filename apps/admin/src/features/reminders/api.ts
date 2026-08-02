/**
 * Reminder Engine admin API.
 *
 * GET  /admin/reminders/status
 * POST /admin/reminders/tick
 */
import { apiRequest } from '@/services/api';

export type ReminderEngineStatus = {
  enabled: boolean;
  cron: string;
  timezone: string;
  liveLeadMinutes: number;
  liveWindowMinutes: number;
  expiryDays: number[];
  chapterLookbackHours: number;
  missedLookbackHours: number;
};

export type ReminderHandlerResult = {
  reminder_type: string;
  scanned: number;
  claimed: number;
  sent: number;
  skipped: number;
  errors: string[];
};

export type ReminderTickResult = {
  started_at: string;
  finished_at: string;
  dry_run: boolean;
  skipped_overlap?: boolean;
  handlers: ReminderHandlerResult[];
};

export function fetchReminderEngineStatus() {
  return apiRequest<ReminderEngineStatus>('/admin/reminders/status');
}

export function runReminderEngineTick(dryRun = false) {
  return apiRequest<ReminderTickResult>('/admin/reminders/tick', {
    method: 'POST',
    params: dryRun ? { dry_run: 'true' } : undefined,
  });
}
