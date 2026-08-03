/**
 * Notification routes.
 *
 * Admin campaigns:
 *   POST   /notifications
 *   GET    /notifications
 *   PUT    /notifications/:id
 *   DELETE /notifications/:id
 *   POST   /notifications/send
 *   GET    /notifications/:id
 *
 * Admin dashboard:
 *   GET /admin/notifications/stats
 *   GET /admin/notifications/campaigns
 *   GET /admin/notifications/export
 *
 * Student Notification Center:
 *   GET    /notification-history
 *   …
 */
import { Router } from 'express';

import {
  deleteNotificationHistoryItem,
  exportAdminNotifications,
  getAdminNotificationStats,
  getNotification,
  getNotificationUnreadCount,
  listAdminNotificationCampaigns,
  listNotificationHistory,
  listNotifications,
  patchNotificationRead,
  postNotification,
  postNotificationReadAll,
  postNotificationSend,
  putNotification,
  removeNotification,
} from '../controllers/notification.controller';
import { requireAuth } from '../middlewares/auth';
import { requirePermission } from '../middlewares/requirePermission';
import { validate } from '../middlewares/validate';
import {
  createNotificationSchema,
  sendNotificationSchema,
  updateNotificationSchema,
} from '../validators/notification.validators';

export const notificationRouter = Router();

notificationRouter.get(
  '/notification-history/unread-count',
  requireAuth,
  getNotificationUnreadCount,
);
notificationRouter.post(
  '/notification-history/read-all',
  requireAuth,
  postNotificationReadAll,
);
notificationRouter.get('/notification-history', requireAuth, listNotificationHistory);
notificationRouter.patch(
  '/notification-history/:inboxId/read',
  requireAuth,
  patchNotificationRead,
);
notificationRouter.delete(
  '/notification-history/:inboxId',
  requireAuth,
  deleteNotificationHistoryItem,
);

// Dashboard routes BEFORE /notifications/:id
notificationRouter.get(
  '/admin/notifications/stats',
  requireAuth,
  requirePermission('communications:read'),
  getAdminNotificationStats,
);
notificationRouter.get(
  '/admin/notifications/campaigns',
  requireAuth,
  requirePermission('communications:read'),
  listAdminNotificationCampaigns,
);
notificationRouter.get(
  '/admin/notifications/export',
  requireAuth,
  requirePermission('communications:read'),
  exportAdminNotifications,
);

notificationRouter.get('/notifications', requireAuth, requirePermission('communications:read'), listNotifications);
notificationRouter.post(
  '/notifications',
  requireAuth,
  requirePermission('communications:create'),
  validate(createNotificationSchema),
  postNotification,
);
notificationRouter.post(
  '/notifications/send',
  requireAuth,
  requirePermission('communications:create'),
  validate(sendNotificationSchema),
  postNotificationSend,
);
notificationRouter.get(
  '/notifications/:notificationId',
  requireAuth,
  requirePermission('communications:read'),
  getNotification,
);
notificationRouter.put(
  '/notifications/:notificationId',
  requireAuth,
  requirePermission('communications:update'),
  validate(updateNotificationSchema),
  putNotification,
);
notificationRouter.delete(
  '/notifications/:notificationId',
  requireAuth,
  requirePermission('communications:delete'),
  removeNotification,
);
