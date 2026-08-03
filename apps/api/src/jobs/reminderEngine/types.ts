/**
 * Reminder Engine — shared types for scheduled notification jobs.
 */
export type ReminderType =
  | 'live_class_upcoming'
  | 'test_tomorrow'
  | 'course_expiry'
  | 'new_chapter'
  | 'missed_class'
  | 'archive_ended_live';

export type ReminderHandlerResult = {
  reminder_type: ReminderType;
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
  handlers: ReminderHandlerResult[];
};

export type ReminderEngineConfig = {
  enabled: boolean;
  cron: string;
  timezone: string;
  /** Minutes before live start to notify (default 60). */
  liveLeadMinutes: number;
  /** Half-width of the claim window around lead time (default 12). */
  liveWindowMinutes: number;
  /** Days-before-expiry milestones (default 7,3,1). */
  expiryDays: number[];
  /** How far back to scan for newly published chapters (hours). */
  chapterLookbackHours: number;
  /** How far back to scan for recently ended live classes (hours). */
  missedLookbackHours: number;
};
