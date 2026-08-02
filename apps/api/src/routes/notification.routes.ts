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
import { requireAdmin } from '../middlewares/requireAdmin';
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
  requireAdmin,
  getAdminNotificationStats,
);
notificationRouter.get(
  '/admin/notifications/campaigns',
  requireAuth,
  requireAdmin,
  listAdminNotificationCampaigns,
);
notificationRouter.get(
  '/admin/notifications/export',
  requireAuth,
  requireAdmin,
  exportAdminNotifications,
);

notificationRouter.get('/notifications', requireAuth, requireAdmin, listNotifications);
notificationRouter.post(
  '/notifications',
  requireAuth,
  requireAdmin,
  validate(createNotificationSchema),
  postNotification,
);
notificationRouter.post(
  '/notifications/send',
  requireAuth,
  requireAdmin,
  validate(sendNotificationSchema),
  postNotificationSend,
);
notificationRouter.get(
  '/notifications/:notificationId',
  requireAuth,
  requireAdmin,
  getNotification,
);
notificationRouter.put(
  '/notifications/:notificationId',
  requireAuth,
  requireAdmin,
  validate(updateNotificationSchema),
  putNotification,
);
notificationRouter.delete(
  '/notifications/:notificationId',
  requireAuth,
  requireAdmin,
  removeNotification,
);
