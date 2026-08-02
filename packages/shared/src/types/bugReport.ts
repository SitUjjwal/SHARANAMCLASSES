/**
 * Bug report domain types.
 */
export type BugReportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

/** Known app surfaces students can tag on a bug report. */
export type BugReportScreenKey =
  | 'home'
  | 'courses'
  | 'course_detail'
  | 'my_learning'
  | 'chapters'
  | 'video_player'
  | 'pdf_viewer'
  | 'tests'
  | 'live'
  | 'profile'
  | 'settings'
  | 'payments'
  | 'notifications'
  | 'other';

export const BUG_REPORT_SCREENS: Array<{
  key: BugReportScreenKey;
  label: string;
}> = [
  { key: 'home', label: 'Home' },
  { key: 'courses', label: 'Courses' },
  { key: 'course_detail', label: 'Course detail' },
  { key: 'my_learning', label: 'My Learning' },
  { key: 'chapters', label: 'Chapters / content' },
  { key: 'video_player', label: 'Video player' },
  { key: 'pdf_viewer', label: 'PDF viewer' },
  { key: 'tests', label: 'Tests' },
  { key: 'live', label: 'Live classes' },
  { key: 'profile', label: 'Profile' },
  { key: 'settings', label: 'Settings' },
  { key: 'payments', label: 'Payments / buy course' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'other', label: 'Other / not sure' },
];

export const BUG_REPORT_SCREEN_LABELS: Record<BugReportScreenKey, string> =
  Object.fromEntries(
    BUG_REPORT_SCREENS.map((s) => [s.key, s.label]),
  ) as Record<BugReportScreenKey, string>;

export type BugReport = {
  id: string;
  ticket_number: string;
  user_id: string;
  description: string;
  screen_key: BugReportScreenKey;
  screen_label: string;
  screenshot_url: string | null;
  status: BugReportStatus;
  admin_note: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminBugReport = BugReport & {
  student_name: string;
  student_email: string | null;
};

export type UpdateBugReportStatusInput = {
  status: BugReportStatus;
  admin_note?: string | null;
};

export const BUG_REPORT_STATUS_LABELS: Record<BugReportStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
};
