/**
 * Admin Feedback Dashboard — aggregated inbox across reviews, bugs, tickets, chats.
 */
export type FeedbackDashboardCategory =
  | 'pending_reviews'
  | 'approved_reviews'
  | 'bug_reports'
  | 'support_tickets'
  | 'feature_requests'
  | 'support_chat'
  | 'all';

export type FeedbackDashboardSource =
  | 'review'
  | 'bug_report'
  | 'feedback'
  | 'support_chat';

export type FeedbackDashboardStats = {
  pending_reviews: number;
  approved_reviews: number;
  rejected_reviews: number;
  bug_reports_open: number;
  bug_reports_total: number;
  support_tickets_open: number;
  support_tickets_total: number;
  feature_requests_open: number;
  feature_requests_total: number;
  support_chats_open: number;
  support_chats_unread: number;
  content_reports_open: number;
  submitted_last_7_days: number;
  resolved_last_7_days: number;
};

export type FeedbackDashboardItem = {
  id: string;
  source: FeedbackDashboardSource;
  category: Exclude<FeedbackDashboardCategory, 'all'>;
  ref: string;
  title: string;
  detail: string;
  status: string;
  student_name: string;
  student_email: string | null;
  created_at: string;
  updated_at: string;
  /** Admin UI deep-link path */
  admin_path: string;
};

export type FeedbackDashboardListPage = {
  items: FeedbackDashboardItem[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export type FeedbackDashboardCsvExport = {
  filename: string;
  csv: string;
};

export const FEEDBACK_DASHBOARD_CATEGORY_LABELS: Record<
  FeedbackDashboardCategory,
  string
> = {
  all: 'All',
  pending_reviews: 'Pending Reviews',
  approved_reviews: 'Approved Reviews',
  bug_reports: 'Bug Reports',
  support_tickets: 'Support Tickets',
  feature_requests: 'Feature Requests',
  support_chat: 'Support Chat',
};
