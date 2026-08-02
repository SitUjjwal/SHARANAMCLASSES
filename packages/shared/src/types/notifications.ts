/**
 * Push notification domain types (mobile ↔ API).
 */
export type PushProvider = 'fcm' | 'apns' | 'expo';
export type PushPlatform = 'ios' | 'android' | 'web';

export type DevicePushToken = {
  id: string;
  user_id: string;
  device_id: string;
  token: string;
  provider: PushProvider;
  platform: PushPlatform;
  app_version: string | null;
  is_active: boolean;
  last_seen_at: string;
};

export type RegisterPushTokenInput = {
  device_id: string;
  token: string;
  provider: PushProvider;
  platform: PushPlatform;
  app_version?: string | null;
};

/** Who should receive a notification campaign. */
export type NotificationAudienceType =
  | 'single_user'
  | 'all_users'
  | 'class'
  | 'course';

export type NotificationType =
  | 'general'
  | 'live_class'
  | 'course_update'
  | 'test_reminder'
  | 'announcement'
  | 'course_expiry'
  | 'missed_class'
  | 'payment';

export type NotificationCampaignStatus =
  | 'draft'
  | 'sending'
  | 'sent'
  | 'partial'
  | 'failed';

export type NotificationDeliveryStatus =
  | 'pending'
  | 'sent'
  | 'failed'
  | 'skipped_no_token';

export type NotificationRecord = {
  id: string;
  title: string;
  body: string;
  deep_link: string | null;
  data: Record<string, string>;
  notification_type: NotificationType;
  audience_type: NotificationAudienceType;
  audience_user_id: string | null;
  audience_class_level: string | null;
  audience_course_id: string | null;
  status: NotificationCampaignStatus;
  target_user_count: number;
  push_success_count: number;
  push_failure_count: number;
  created_by: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

export type NotificationDeliveryRecord = {
  id: string;
  notification_id: string;
  user_id: string;
  device_token_id: string | null;
  provider: PushProvider | null;
  token: string | null;
  status: NotificationDeliveryStatus;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
};

/** Student Notification Center row (inbox). */
export type NotificationInboxItem = {
  id: string;
  notification_id: string;
  title: string;
  body: string;
  deep_link: string | null;
  data: Record<string, string>;
  notification_type: NotificationType;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

export type NotificationHistoryPage = {
  items: NotificationInboxItem[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  unreadCount: number;
};

/** Admin Notification Dashboard KPIs */
export type NotificationAdminStats = {
  total_notifications: number;
  delivered: number;
  opened: number;
  failed: number;
  /** opened / delivered * 100 (0 if no deliveries) */
  click_rate_percent: number;
};

export type NotificationAdminCampaignRow = {
  id: string;
  title: string;
  body: string;
  notification_type: NotificationType;
  audience_type: NotificationAudienceType;
  status: NotificationCampaignStatus;
  target_user_count: number;
  delivered: number;
  failed: number;
  opened: number;
  click_rate_percent: number;
  sent_at: string | null;
  created_at: string;
};

export type NotificationAdminListPage = {
  items: NotificationAdminCampaignRow[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export type NotificationAdminCsvExport = {
  filename: string;
  csv: string;
};
