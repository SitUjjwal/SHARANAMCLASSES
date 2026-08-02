/**
 * Notification HTTP handlers.
 *
 * Canonical paths:
 *   POST /notifications
 *   GET  /notifications
 *   POST /notifications/send
 *   GET  /notification-history
 *   GET  /notification-history/unread-count
 *   PATCH /notification-history/:inboxId/read
 *   POST /notification-history/read-all
 *   DELETE /notification-history/:inboxId
 */
import type { NextFunction, Request, Response } from 'express';

import {
  createAndMaybeSendNotification,
  deleteNotificationCampaign,
  getNotificationForAdmin,
  getUnreadNotificationCount,
  listNotificationInboxPage,
  listNotificationsForAdmin,
  markAllInboxRead,
  markInboxItemRead,
  sendNotification,
  softDeleteInboxItem,
  updateNotification,
} from '../services/notification.service';
import {
  exportNotificationAdminCsv,
  getNotificationAdminStats,
  listNotificationAdminCampaigns,
  type NotificationAdminFilters,
} from '../services/notificationAdmin.service';
import type {
  CreateNotificationInput,
  SendNotificationInput,
  UpdateNotificationInput,
} from '../validators/notification.validators';
import { requireParam } from '../utils/params';
import type { NotificationCampaignStatus, NotificationType } from '@sharanam/shared';

export async function postNotification(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = req.body as CreateNotificationInput;
    const data = await createAndMaybeSendNotification(input, req.user?.id ?? null);
    res.status(201).json({
      success: true,
      data,
      message: input.send ? 'Notification saved and sent' : 'Notification saved',
    });
  } catch (error) {
    next(error);
  }
}

export async function putNotification(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const notificationId = requireParam(req.params.notificationId, 'notificationId');
    const input = req.body as UpdateNotificationInput;
    const data = await updateNotification(notificationId, input);
    res.status(200).json({
      success: true,
      data,
      message:
        input.send && data.status !== 'draft'
          ? 'Notification updated and sent'
          : 'Notification updated',
    });
  } catch (error) {
    next(error);
  }
}

export async function removeNotification(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const notificationId = requireParam(req.params.notificationId, 'notificationId');
    await deleteNotificationCampaign(notificationId);
    res.status(200).json({
      success: true,
      data: null,
      message: 'Notification deleted',
    });
  } catch (error) {
    next(error);
  }
}

export async function postNotificationSend(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as SendNotificationInput;
    const notificationId =
      body.notification_id ??
      body.id ??
      (typeof req.params.notificationId === 'string' ? req.params.notificationId : '');
    if (!notificationId) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'notification_id is required' },
      });
      return;
    }
    const data = await sendNotification(notificationId);
    res.status(200).json({ success: true, data, message: 'Notification sent' });
  } catch (error) {
    next(error);
  }
}

export async function listNotifications(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const limit = Number(req.query.limit ?? 50);
    const data = await listNotificationsForAdmin(Number.isFinite(limit) ? limit : 50);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getNotification(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const notificationId = requireParam(req.params.notificationId, 'notificationId');
    const data = await getNotificationForAdmin(notificationId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function listNotificationHistory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
      return;
    }
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    const data = await listNotificationInboxPage(userId, {
      page: Number.isFinite(page) ? page : 1,
      pageSize: Number.isFinite(pageSize) ? pageSize : 20,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getNotificationUnreadCount(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
      return;
    }
    const unreadCount = await getUnreadNotificationCount(userId);
    res.status(200).json({ success: true, data: { unreadCount } });
  } catch (error) {
    next(error);
  }
}

export async function patchNotificationRead(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
      return;
    }
    const inboxId = requireParam(req.params.inboxId, 'inboxId');
    const data = await markInboxItemRead(userId, inboxId);
    res.status(200).json({ success: true, data, message: 'Marked as read' });
  } catch (error) {
    next(error);
  }
}

export async function postNotificationReadAll(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
      return;
    }
    const data = await markAllInboxRead(userId);
    res.status(200).json({ success: true, data, message: 'All marked as read' });
  } catch (error) {
    next(error);
  }
}

export async function deleteNotificationHistoryItem(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
      return;
    }
    const inboxId = requireParam(req.params.inboxId, 'inboxId');
    await softDeleteInboxItem(userId, inboxId);
    res.status(200).json({ success: true, data: null, message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
}

function parseAdminFilters(req: Request): NotificationAdminFilters {
  const statusRaw = String(req.query.status ?? 'all');
  const typeRaw = String(req.query.type ?? 'all');
  return {
    search: typeof req.query.search === 'string' ? req.query.search : '',
    status: statusRaw as NotificationAdminFilters['status'],
    type: typeRaw as NotificationAdminFilters['type'],
    page: Number(req.query.page ?? 1),
    pageSize: Number(req.query.pageSize ?? 20),
  };
}

/** GET /admin/notifications/stats */
export async function getAdminNotificationStats(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await getNotificationAdminStats();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /admin/notifications/campaigns */
export async function listAdminNotificationCampaigns(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const filters = parseAdminFilters(req);
    // Narrow invalid filter values
    const allowedStatus = new Set([
      'all',
      'draft',
      'sending',
      'sent',
      'partial',
      'failed',
    ]);
    const allowedType = new Set([
      'all',
      'general',
      'live_class',
      'course_update',
      'test_reminder',
      'announcement',
    ]);
    if (!allowedStatus.has(String(filters.status))) {
      filters.status = 'all';
    }
    if (!allowedType.has(String(filters.type))) {
      filters.type = 'all';
    }
    void (filters.status as NotificationCampaignStatus | 'all');
    void (filters.type as NotificationType | 'all');

    const data = await listNotificationAdminCampaigns(filters);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /admin/notifications/export */
export async function exportAdminNotifications(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const filters = parseAdminFilters(req);
    const data = await exportNotificationAdminCsv({
      search: filters.search,
      status: filters.status,
      type: filters.type,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
