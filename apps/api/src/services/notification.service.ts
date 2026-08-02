/**
 * Notification Service
 *
 * Architecture:
 * 1) Save campaign row (`notifications`)
 * 2) Resolve audience → user_ids (single / all / class / course)
 * 3) Load active device tokens
 * 4) Insert `notification_deliveries` (pending | skipped_no_token)
 * 5) Push via Firebase Admin (FCM) + Expo Push API (Expo tokens)
 * 6) Update per-delivery status + campaign aggregates
 *
 * Layers call this service; HTTP stays thin in controllers.
 */
import { getSupabaseAdmin } from '../config/supabase';
import { sendToTokens, type PushMessagePayload } from '../integrations/fcm/client';
import { sendExpoPushToTokens } from '../integrations/expoPush/client';
import {
  deactivateTokensByValue,
  listActiveTokensForUsers,
  type DevicePushTokenRecord,
} from './devicePush.service';
import { AppError } from '../utils/AppError';
import type { CreateNotificationInput } from '../validators/notification.validators';

export type NotificationRecord = {
  id: string;
  title: string;
  body: string;
  deep_link: string | null;
  data: Record<string, string>;
  notification_type: string;
  audience_type: CreateNotificationInput['audience_type'];
  audience_user_id: string | null;
  audience_class_level: string | null;
  audience_course_id: string | null;
  status: 'draft' | 'sending' | 'sent' | 'partial' | 'failed';
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
  provider: string | null;
  token: string | null;
  status: 'pending' | 'sent' | 'failed' | 'skipped_no_token';
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
};

export type NotificationWithSummary = NotificationRecord & {
  deliveries?: NotificationDeliveryRecord[];
};

const NOTIFICATION_COLUMNS =
  'id, title, body, deep_link, data, notification_type, audience_type, audience_user_id, audience_class_level, audience_course_id, status, target_user_count, push_success_count, push_failure_count, created_by, sent_at, created_at, updated_at';

const DELIVERY_COLUMNS =
  'id, notification_id, user_id, device_token_id, provider, token, status, error_message, sent_at, created_at';

const FCM_CHUNK = 450;

function asStringData(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === 'string') out[k] = v;
  }
  return out;
}

function mapNotification(row: Record<string, unknown>): NotificationRecord {
  return {
    ...(row as Omit<NotificationRecord, 'data'>),
    data: asStringData(row.data),
  };
}

/**
 * Resolve target user ids from audience rules.
 */
export async function resolveAudienceUserIds(
  input: {
    audience_type: CreateNotificationInput['audience_type'];
    audience_user_id?: string;
    audience_class_level?: string;
    audience_course_id?: string;
  },
): Promise<string[]> {
  const supabase = getSupabaseAdmin();

  if (input.audience_type === 'single_user') {
    const userId = input.audience_user_id;
    if (!userId) {
      throw new AppError(400, 'AUDIENCE_INVALID', 'audience_user_id required');
    }
    return [userId];
  }

  if (input.audience_type === 'all_users') {
    const { data, error } = await supabase.from('profiles').select('id');
    if (error) {
      throw new AppError(500, 'AUDIENCE_RESOLVE_FAILED', error.message);
    }
    return (data ?? []).map((r) => r.id as string);
  }

  if (input.audience_type === 'class') {
    const level = input.audience_class_level;
    if (!level) {
      throw new AppError(400, 'AUDIENCE_INVALID', 'audience_class_level required');
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('class_level', level);
    if (error) {
      throw new AppError(500, 'AUDIENCE_RESOLVE_FAILED', error.message);
    }
    return (data ?? []).map((r) => r.id as string);
  }

  // course
  const courseId = input.audience_course_id;
  if (!courseId) {
    throw new AppError(400, 'AUDIENCE_INVALID', 'audience_course_id required');
  }
  const { data, error } = await supabase
    .from('enrollments')
    .select('user_id')
    .eq('course_id', courseId);
  if (error) {
    throw new AppError(500, 'AUDIENCE_RESOLVE_FAILED', error.message);
  }
  return [...new Set((data ?? []).map((r) => r.user_id as string))];
}

/**
 * Persist notification only (status = draft). Does not push.
 */
export async function saveNotification(
  input: CreateNotificationInput,
  createdBy: string | null,
): Promise<NotificationRecord> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      title: input.title,
      body: input.body,
      deep_link: input.deep_link ?? null,
      data: input.data ?? {},
      notification_type: input.notification_type ?? 'general',
      audience_type: input.audience_type,
      audience_user_id:
        input.audience_type === 'single_user' ? input.audience_user_id ?? null : null,
      audience_class_level:
        input.audience_type === 'class' ? input.audience_class_level ?? null : null,
      audience_course_id:
        input.audience_type === 'course' ? input.audience_course_id ?? null : null,
      status: 'draft',
      created_by: createdBy,
      created_at: now,
      updated_at: now,
    })
    .select(NOTIFICATION_COLUMNS)
    .single();

  if (error || !data) {
    throw new AppError(
      500,
      'NOTIFICATION_SAVE_FAILED',
      error?.message ?? 'Could not save notification',
    );
  }

  return mapNotification(data as Record<string, unknown>);
}

/**
 * Update campaign fields. Inbox reads title/body from this row, so edits show for students.
 * `send: true` only pushes when the campaign is still a draft.
 */
export async function updateNotification(
  notificationId: string,
  input: CreateNotificationInput,
): Promise<NotificationWithSummary> {
  const supabase = getSupabaseAdmin();
  const existing = await getNotificationForAdmin(notificationId);

  const { data, error } = await supabase
    .from('notifications')
    .update({
      title: input.title,
      body: input.body,
      deep_link: input.deep_link ?? null,
      data: input.data ?? existing.data,
      notification_type: input.notification_type ?? existing.notification_type,
      audience_type: input.audience_type,
      audience_user_id:
        input.audience_type === 'single_user' ? input.audience_user_id ?? null : null,
      audience_class_level:
        input.audience_type === 'class' ? input.audience_class_level ?? null : null,
      audience_course_id:
        input.audience_type === 'course' ? input.audience_course_id ?? null : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', notificationId)
    .select(NOTIFICATION_COLUMNS)
    .single();

  if (error || !data) {
    throw new AppError(
      500,
      'NOTIFICATION_UPDATE_FAILED',
      error?.message ?? 'Could not update notification',
    );
  }

  const updated = mapNotification(data as Record<string, unknown>);
  if (input.send === true && updated.status === 'draft') {
    return sendNotification(notificationId);
  }

  const { data: deliveries } = await supabase
    .from('notification_deliveries')
    .select(DELIVERY_COLUMNS)
    .eq('notification_id', notificationId);

  return {
    ...updated,
    deliveries: (deliveries ?? []) as NotificationDeliveryRecord[],
  };
}

/**
 * Hard-delete a campaign (cascades deliveries + inbox via FK).
 */
export async function deleteNotificationCampaign(notificationId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .select('id')
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'NOTIFICATION_DELETE_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found');
  }
}

async function markCampaignStatus(
  notificationId: string,
  patch: Partial<{
    status: NotificationRecord['status'];
    target_user_count: number;
    push_success_count: number;
    push_failure_count: number;
    sent_at: string | null;
  }>,
): Promise<NotificationRecord> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('notifications')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', notificationId)
    .select(NOTIFICATION_COLUMNS)
    .single();

  if (error || !data) {
    throw new AppError(
      500,
      'NOTIFICATION_UPDATE_FAILED',
      error?.message ?? 'Could not update notification',
    );
  }
  return mapNotification(data as Record<string, unknown>);
}

async function insertDeliveries(
  notificationId: string,
  userIds: string[],
  tokensByUser: Map<string, DevicePushTokenRecord[]>,
): Promise<NotificationDeliveryRecord[]> {
  const supabase = getSupabaseAdmin();
  const rows: Array<Record<string, unknown>> = [];

  for (const userId of userIds) {
    const tokens = tokensByUser.get(userId) ?? [];
    if (!tokens.length) {
      rows.push({
        notification_id: notificationId,
        user_id: userId,
        device_token_id: null,
        provider: null,
        token: null,
        status: 'skipped_no_token',
        error_message: 'No active push token for user',
        sent_at: null,
      });
      continue;
    }
    for (const token of tokens) {
      rows.push({
        notification_id: notificationId,
        user_id: userId,
        device_token_id: token.id,
        provider: token.provider,
        token: token.token,
        status: 'pending',
        error_message: null,
        sent_at: null,
      });
    }
  }

  if (!rows.length) return [];

  const { data, error } = await supabase
    .from('notification_deliveries')
    .insert(rows)
    .select(DELIVERY_COLUMNS);

  if (error) {
    throw new AppError(500, 'DELIVERY_INSERT_FAILED', error.message);
  }
  return (data ?? []) as NotificationDeliveryRecord[];
}

async function updateDeliveryStatuses(
  updates: Array<{
    id: string;
    status: NotificationDeliveryRecord['status'];
    error_message?: string | null;
    sent_at?: string | null;
  }>,
): Promise<void> {
  if (!updates.length) return;
  const supabase = getSupabaseAdmin();
  // Supabase has no bulk update-by-id helper; patch in small parallel batches.
  const BATCH = 40;
  for (let i = 0; i < updates.length; i += BATCH) {
    const slice = updates.slice(i, i + BATCH);
    await Promise.all(
      slice.map((u) =>
        supabase
          .from('notification_deliveries')
          .update({
            status: u.status,
            error_message: u.error_message ?? null,
            sent_at: u.sent_at ?? null,
          })
          .eq('id', u.id),
      ),
    );
  }
}

/**
 * Send a saved notification: resolve audience → push → store delivery status.
 */
export async function sendNotification(
  notificationId: string,
): Promise<NotificationWithSummary> {
  const supabase = getSupabaseAdmin();
  const { data: existing, error: loadError } = await supabase
    .from('notifications')
    .select(NOTIFICATION_COLUMNS)
    .eq('id', notificationId)
    .maybeSingle();

  if (loadError) {
    throw new AppError(500, 'NOTIFICATION_LOAD_FAILED', loadError.message);
  }
  if (!existing) {
    throw new AppError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found');
  }

  const notification = mapNotification(existing as Record<string, unknown>);
  if (notification.status === 'sending') {
    throw new AppError(409, 'NOTIFICATION_SENDING', 'Send already in progress');
  }

  await markCampaignStatus(notificationId, { status: 'sending' });

  const userIds = await resolveAudienceUserIds({
    audience_type: notification.audience_type,
    audience_user_id: notification.audience_user_id ?? undefined,
    audience_class_level: notification.audience_class_level ?? undefined,
    audience_course_id: notification.audience_course_id ?? undefined,
  });

  const tokens = await listActiveTokensForUsers(userIds);
  const tokensByUser = new Map<string, DevicePushTokenRecord[]>();
  for (const token of tokens) {
    const list = tokensByUser.get(token.user_id) ?? [];
    list.push(token);
    tokensByUser.set(token.user_id, list);
  }

  // Clear prior deliveries if re-sending a draft/failed campaign.
  await supabase
    .from('notification_deliveries')
    .delete()
    .eq('notification_id', notificationId);

  const deliveries = await insertDeliveries(notificationId, userIds, tokensByUser);

  // Inbox rows power Notification Center (badge / read / delete) even without a device token.
  await upsertInboxForUsers(notificationId, userIds);

  const payload: PushMessagePayload = {
    title: notification.title,
    body: notification.body,
    deepLink: notification.deep_link ?? undefined,
    data: {
      ...notification.data,
      notificationId,
      notificationType: notification.notification_type,
    },
  };

  const pending = deliveries.filter((d) => d.status === 'pending' && d.token);
  const expoPending = pending.filter((d) => d.provider === 'expo');
  // Firebase Admin multicast expects FCM registration tokens (not raw APNs).
  const firebasePending = pending.filter((d) => d.provider === 'fcm');
  const apnsOnly = pending.filter((d) => d.provider === 'apns');

  const statusUpdates: Array<{
    id: string;
    status: NotificationDeliveryRecord['status'];
    error_message?: string | null;
    sent_at?: string | null;
  }> = [];
  const now = new Date().toISOString();
  let successCount = 0;
  let failureCount = 0;
  const failedTokenValues: string[] = [];

  // APNs without FCM: mark failed with clear reason (needs native FCM or APNs cert path).
  for (const d of apnsOnly) {
    statusUpdates.push({
      id: d.id,
      status: 'failed',
      error_message: 'Raw APNs tokens require APNs credentials; use FCM for iOS in production builds',
      sent_at: now,
    });
    failureCount += 1;
  }

  // Firebase Admin multicast (chunked).
  for (let i = 0; i < firebasePending.length; i += FCM_CHUNK) {
    const chunk = firebasePending.slice(i, i + FCM_CHUNK);
    const tokenValues = chunk.map((d) => d.token!).filter(Boolean);
    const result = await sendToTokens(tokenValues, payload);
    const failedSet = new Set(result.failedTokens);

    for (const d of chunk) {
      if (!d.token || failedSet.has(d.token)) {
        statusUpdates.push({
          id: d.id,
          status: 'failed',
          error_message: 'FCM send failed',
          sent_at: now,
        });
        failureCount += 1;
        if (d.token) failedTokenValues.push(d.token);
      } else {
        statusUpdates.push({
          id: d.id,
          status: 'sent',
          error_message: null,
          sent_at: now,
        });
        successCount += 1;
      }
    }
  }

  // Expo Push API for Expo Go / Expo tokens.
  if (expoPending.length) {
    const tokenValues = expoPending.map((d) => d.token!).filter(Boolean);
    const result = await sendExpoPushToTokens(tokenValues, payload);
    const failedSet = new Set(result.failedTokens);

    for (const d of expoPending) {
      if (!d.token || failedSet.has(d.token)) {
        statusUpdates.push({
          id: d.id,
          status: 'failed',
          error_message: 'Expo push send failed',
          sent_at: now,
        });
        failureCount += 1;
        if (d.token) failedTokenValues.push(d.token);
      } else {
        statusUpdates.push({
          id: d.id,
          status: 'sent',
          error_message: null,
          sent_at: now,
        });
        successCount += 1;
      }
    }
  }

  await updateDeliveryStatuses(statusUpdates);

  if (failedTokenValues.length) {
    await deactivateTokensByValue(failedTokenValues).catch((err) => {
      console.warn('[notifications] failed token deactivate', err);
    });
  }

  const attempted = firebasePending.length + expoPending.length + apnsOnly.length;
  let finalStatus: NotificationRecord['status'] = 'sent';
  if (attempted === 0) {
    finalStatus = userIds.length === 0 ? 'failed' : 'sent'; // audience saved; no devices = sent with skips
  } else if (successCount === 0) {
    finalStatus = 'failed';
  } else if (failureCount > 0) {
    finalStatus = 'partial';
  }

  const updated = await markCampaignStatus(notificationId, {
    status: finalStatus,
    target_user_count: userIds.length,
    push_success_count: successCount,
    push_failure_count: failureCount,
    sent_at: now,
  });

  const { data: finalDeliveries } = await supabase
    .from('notification_deliveries')
    .select(DELIVERY_COLUMNS)
    .eq('notification_id', notificationId);

  return {
    ...updated,
    deliveries: (finalDeliveries ?? []) as NotificationDeliveryRecord[],
  };
}

/**
 * Save + optionally send in one call (admin default).
 */
export async function createAndMaybeSendNotification(
  input: CreateNotificationInput,
  createdBy: string | null,
): Promise<NotificationWithSummary> {
  const saved = await saveNotification(input, createdBy);
  if (input.send === false) {
    return saved;
  }
  return sendNotification(saved.id);
}

export async function listNotificationsForAdmin(limit = 50): Promise<NotificationRecord[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('notifications')
    .select(NOTIFICATION_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 200));

  if (error) {
    throw new AppError(500, 'NOTIFICATION_LIST_FAILED', error.message);
  }
  return (data ?? []).map((row) => mapNotification(row as Record<string, unknown>));
}

export async function getNotificationForAdmin(
  notificationId: string,
): Promise<NotificationWithSummary> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('notifications')
    .select(NOTIFICATION_COLUMNS)
    .eq('id', notificationId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'NOTIFICATION_LOAD_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found');
  }

  const { data: deliveries, error: dErr } = await supabase
    .from('notification_deliveries')
    .select(DELIVERY_COLUMNS)
    .eq('notification_id', notificationId)
    .order('created_at', { ascending: true });

  if (dErr) {
    throw new AppError(500, 'DELIVERY_LIST_FAILED', dErr.message);
  }

  return {
    ...mapNotification(data as Record<string, unknown>),
    deliveries: (deliveries ?? []) as NotificationDeliveryRecord[],
  };
}

/**
 * Student history: notifications that produced a delivery row for this user.
 * @deprecated Prefer listNotificationInboxPage — kept for brief compat.
 */
export async function listNotificationsForUser(
  userId: string,
  limit = 50,
): Promise<
  Array<{
    notification: NotificationRecord;
    delivery_status: NotificationDeliveryRecord['status'];
    delivered_at: string | null;
  }>
> {
  const page = await listNotificationInboxPage(userId, { page: 1, pageSize: limit });
  return page.items.map((item) => ({
    notification: {
      id: item.notification_id,
      title: item.title,
      body: item.body,
      deep_link: item.deep_link,
      data: item.data,
      notification_type: item.notification_type as NotificationRecord['notification_type'],
      audience_type: 'single_user',
      audience_user_id: userId,
      audience_class_level: null,
      audience_course_id: null,
      status: 'sent',
      target_user_count: 0,
      push_success_count: 0,
      push_failure_count: 0,
      created_by: null,
      sent_at: item.created_at,
      created_at: item.created_at,
      updated_at: item.created_at,
    },
    delivery_status: 'sent',
    delivered_at: item.created_at,
  }));
}

async function upsertInboxForUsers(
  notificationId: string,
  userIds: string[],
): Promise<void> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return;

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const rows = unique.map((user_id) => ({
    user_id,
    notification_id: notificationId,
    created_at: now,
  }));

  // Upsert in chunks — ignore conflicts so re-sends keep existing read state.
  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const { error } = await supabase.from('notification_inbox').upsert(slice, {
      onConflict: 'user_id,notification_id',
      ignoreDuplicates: true,
    });
    if (error) {
      throw new AppError(500, 'INBOX_UPSERT_FAILED', error.message);
    }
  }
}

export type NotificationInboxItem = {
  id: string;
  notification_id: string;
  title: string;
  body: string;
  deep_link: string | null;
  data: Record<string, string>;
  notification_type: string;
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

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from('notification_inbox')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('deleted_at', null)
    .is('read_at', null);

  if (error) {
    throw new AppError(500, 'UNREAD_COUNT_FAILED', error.message);
  }
  return count ?? 0;
}

export async function listNotificationInboxPage(
  userId: string,
  opts: { page?: number; pageSize?: number } = {},
): Promise<NotificationHistoryPage> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(Math.max(opts.pageSize ?? 20, 1), 50);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = getSupabaseAdmin();

  const [listResult, unreadCount] = await Promise.all([
    supabase
      .from('notification_inbox')
      .select(
        `id, notification_id, read_at, created_at, notification:notifications (id, title, body, deep_link, data, notification_type)`,
        { count: 'exact' },
      )
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(from, to),
    getUnreadNotificationCount(userId),
  ]);

  if (listResult.error) {
    throw new AppError(500, 'NOTIFICATION_HISTORY_FAILED', listResult.error.message);
  }

  const total = listResult.count ?? 0;
  const items: NotificationInboxItem[] = [];

  for (const row of listResult.data ?? []) {
    const raw = row as unknown as {
      id: string;
      notification_id: string;
      read_at: string | null;
      created_at: string;
      notification: Record<string, unknown> | Record<string, unknown>[] | null;
    };
    const nested = Array.isArray(raw.notification)
      ? raw.notification[0]
      : raw.notification;
    if (!nested) continue;

    items.push({
      id: raw.id,
      notification_id: raw.notification_id,
      title: String(nested.title ?? ''),
      body: String(nested.body ?? ''),
      deep_link: (nested.deep_link as string | null) ?? null,
      data: asStringData(nested.data),
      notification_type: String(nested.notification_type ?? 'general'),
      is_read: Boolean(raw.read_at),
      read_at: raw.read_at,
      created_at: raw.created_at,
    });
  }

  return {
    items,
    page,
    pageSize,
    total,
    hasMore: from + items.length < total,
    unreadCount,
  };
}

export async function markInboxItemRead(
  userId: string,
  inboxId: string,
): Promise<NotificationInboxItem> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('notification_inbox')
    .update({ read_at: now })
    .eq('id', inboxId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .select(
      `id, notification_id, read_at, created_at, notification:notifications (id, title, body, deep_link, data, notification_type)`,
    )
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'MARK_READ_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'INBOX_NOT_FOUND', 'Notification not found');
  }

  const raw = data as unknown as {
    id: string;
    notification_id: string;
    read_at: string | null;
    created_at: string;
    notification: Record<string, unknown> | Record<string, unknown>[] | null;
  };
  const nested = Array.isArray(raw.notification)
    ? raw.notification[0]
    : raw.notification;

  return {
    id: raw.id,
    notification_id: raw.notification_id,
    title: String(nested?.title ?? ''),
    body: String(nested?.body ?? ''),
    deep_link: (nested?.deep_link as string | null) ?? null,
    data: asStringData(nested?.data),
    notification_type: String(nested?.notification_type ?? 'general'),
    is_read: Boolean(raw.read_at),
    read_at: raw.read_at,
    created_at: raw.created_at,
  };
}

export async function markAllInboxRead(userId: string): Promise<{ updated: number }> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('notification_inbox')
    .update({ read_at: now })
    .eq('user_id', userId)
    .is('deleted_at', null)
    .is('read_at', null)
    .select('id');

  if (error) {
    throw new AppError(500, 'MARK_ALL_READ_FAILED', error.message);
  }
  return { updated: data?.length ?? 0 };
}

export async function softDeleteInboxItem(
  userId: string,
  inboxId: string,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('notification_inbox')
    .update({ deleted_at: now, read_at: now })
    .eq('id', inboxId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'INBOX_DELETE_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'INBOX_NOT_FOUND', 'Notification not found');
  }
}
