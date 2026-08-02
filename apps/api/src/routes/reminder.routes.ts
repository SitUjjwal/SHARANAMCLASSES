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
import { requireAdmin } from '../middlewares/requireAdmin';

export const reminderRouter = Router();

reminderRouter.get(
  '/admin/reminders/status',
  requireAuth,
  requireAdmin,
  getReminderEngineStatus,
);

reminderRouter.post(
  '/admin/reminders/tick',
  requireAuth,
  requireAdmin,
  postReminderEngineTick,
);
