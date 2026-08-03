/**
 * Admin dashboard / revenue / reports / activity / settings types.
 */

export type AdminChartPoint = {
  label: string;
  value: number;
};

export type AdminDashboardOverview = {
  total_students: number;
  active_students: number;
  total_teachers: number;
  total_courses: number;
  published_courses: number;
  total_tests: number;
  live_classes_today: number;
  today_revenue_paise: number;
  today_revenue_display: string;
  monthly_revenue_paise: number;
  monthly_revenue_display: string;
  pending_payments: number;
  support_tickets_open: number;
  feedback_pending: number;
  pending_reviews: number;
  open_bug_reports: number;
  total_enrollments: number;
  revenue_series: AdminChartPoint[];
  student_series: AdminChartPoint[];
  course_series: AdminChartPoint[];
};

export type AdminRevenueOverview = {
  today_revenue_paise: number;
  today_revenue_display: string;
  monthly_revenue_paise: number;
  monthly_revenue_display: string;
  total_paid_paise: number;
  total_paid_display: string;
  paid_orders: number;
  failed_payments: number;
  pending_payments: number;
  revenue_series: AdminChartPoint[];
  timezone: string;
};

export type AdminReportFormat = 'csv' | 'xlsx' | 'pdf';

export type AdminReportSummary = {
  key: string;
  title: string;
  description: string;
  href: string | null;
  /** @deprecated Prefer formats + /admin/reports/:key/export */
  export_path: string | null;
  formats: AdminReportFormat[];
};

export type AdminReportFileExport = {
  key: string;
  title: string;
  format: AdminReportFormat;
  filename: string;
  base64: string;
  mime: string;
  row_count: number;
};

export type AdminActivityLog = {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  summary: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AdminActivityLogPage = {
  items: AdminActivityLog[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export type PlatformGeneralSettings = {
  app_name: string;
  logo_url: string;
  logo_storage_key: string;
  primary_color: string;
  support_email: string;
  support_phone: string;
  privacy_policy: string;
  terms: string;
  maintenance_mode: boolean;
  app_version: string;
  /** Minimum client version recommended/required (semver-ish string). */
  min_app_version: string;
  timezone: string;
};

/** Public subset for mobile/web bootstrap (no secrets). */
export type PublicPlatformConfig = {
  app_name: string;
  logo_url: string;
  primary_color: string;
  support_email: string;
  support_phone: string;
  privacy_policy: string;
  terms: string;
  maintenance_mode: boolean;
  app_version: string;
  min_app_version: string;
  timezone: string;
  updated_at: string | null;
};

export type PlatformSettingsBundle = {
  general: PlatformGeneralSettings;
  updated_at: string | null;
};

export type PlatformLogoUploadResult = {
  logo_url: string;
  logo_storage_key: string;
};

export type AdminCsvExport = {
  filename: string;
  csv: string;
};

/** Re-exported from rbac.ts for backward-compatible imports. */
export type {
  AdminUiRole,
  AdminPermission,
  LegacyAdminPermission,
  RbacRole,
  RbacPermission,
  RbacModule,
  RbacAction,
} from '../rbac';
