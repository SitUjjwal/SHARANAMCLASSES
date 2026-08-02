/**
 * Support chat routes.
 *
 * Student:
 *   GET  /support/chat | /support/history
 *   GET  /support/chat/unread-count
 *   POST /support/chat/messages | /support/message
 *   POST /support/chat/read
 *
 * Admin:
 *   GET  /admin/support/chats
 *   GET  /admin/support/chats/:conversationId
 *   POST /admin/support/chats/:conversationId/messages
 *   POST /admin/support/chats/:conversationId/read
 *   POST /admin/support/chats/:conversationId/typing
 */
import { Router } from 'express';

import {
  getAdminChat,
  getStudentChat,
  getStudentChatUnread,
  listAdminChats,
  postAdminChatMessage,
  postAdminChatRead,
  postAdminTyping,
  postStudentChatMessage,
  postStudentChatRead,
} from '../controllers/supportChat.controller';
import { requireAuth } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/requireAdmin';
import { validate } from '../middlewares/validate';
import {
  adminTypingSchema,
  sendSupportChatMessageSchema,
} from '../validators/supportChat.validators';

export const supportChatRouter = Router();

supportChatRouter.get('/support/chat', requireAuth, getStudentChat);
/** Spec alias — conversation + message history */
supportChatRouter.get('/support/history', requireAuth, getStudentChat);
supportChatRouter.get('/support/chat/unread-count', requireAuth, getStudentChatUnread);
supportChatRouter.post(
  '/support/chat/messages',
  requireAuth,
  validate(sendSupportChatMessageSchema),
  postStudentChatMessage,
);
/** Spec alias */
supportChatRouter.post(
  '/support/message',
  requireAuth,
  validate(sendSupportChatMessageSchema),
  postStudentChatMessage,
);
supportChatRouter.post('/support/chat/read', requireAuth, postStudentChatRead);

supportChatRouter.get(
  '/admin/support/chats',
  requireAuth,
  requireAdmin,
  listAdminChats,
);
supportChatRouter.get(
  '/admin/support/chats/:conversationId',
  requireAuth,
  requireAdmin,
  getAdminChat,
);
supportChatRouter.post(
  '/admin/support/chats/:conversationId/messages',
  requireAuth,
  requireAdmin,
  validate(sendSupportChatMessageSchema),
  postAdminChatMessage,
);
supportChatRouter.post(
  '/admin/support/chats/:conversationId/read',
  requireAuth,
  requireAdmin,
  postAdminChatRead,
);
supportChatRouter.post(
  '/admin/support/chats/:conversationId/typing',
  requireAuth,
  requireAdmin,
  validate(adminTypingSchema),
  postAdminTyping,
);
