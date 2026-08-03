/**
 * Reminder Engine admin routes.
 *
 *   GET  /admin/reminders/status
 *   POST /admin/reminders/tick?dry_run=true
 */
import { Router } from 'express';

import {
  getReminderEngineStatus,
  postReminderEngineTick,
} from '../controllers/reminder.controller';
import { requireAuth } from '../middlewares/auth';
import { requirePermission } from '../middlewares/requirePermission';

export const reminderRouter = Router();

reminderRouter.get(
  '/admin/reminders/status',
  requireAuth,
  requirePermission('communications:read'),
  getReminderEngineStatus,
);

reminderRouter.post(
  '/admin/reminders/tick',
  requireAuth,
  requirePermission('communications:create'),
  postReminderEngineTick,
);
