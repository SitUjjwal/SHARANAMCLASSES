/**
 * Support chat HTTP handlers.
 */
import type { NextFunction, Request, Response } from 'express';

import {
  getAdminChatThread,
  getStudentChatThread,
  getStudentUnreadCount,
  listAdminConversations,
  markAdminRead,
  markStudentRead,
  sendAdminMessage,
  sendStudentMessage,
  setAdminTyping,
} from '../services/supportChat.service';
import { AppError } from '../utils/AppError';
import { requireParam } from '../utils/params';
import type {
  AdminTypingBody,
  SendSupportChatMessageBody,
} from '../validators/supportChat.validators';

function assertUserId(req: Request): string {
  if (!req.user?.id) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  return req.user.id;
}

/** GET /support/chat */
export async function getStudentChat(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const data = await getStudentChatThread(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /support/chat/unread-count */
export async function getStudentChatUnread(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const unread_count = await getStudentUnreadCount(userId);
    res.status(200).json({ success: true, data: { unread_count } });
  } catch (error) {
    next(error);
  }
}

/** POST /support/chat/messages */
export async function postStudentChatMessage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const body = req.body as SendSupportChatMessageBody;
    const data = await sendStudentMessage(userId, body.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** POST /support/chat/read */
export async function postStudentChatRead(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const data = await markStudentRead(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /admin/support/chats */
export async function listAdminChats(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertUserId(req);
    const data = await listAdminConversations();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /admin/support/chats/:conversationId */
export async function getAdminChat(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertUserId(req);
    const conversationId = requireParam(req.params.conversationId, 'conversationId');
    const data = await getAdminChatThread(conversationId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** POST /admin/support/chats/:conversationId/messages */
export async function postAdminChatMessage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const adminId = assertUserId(req);
    const conversationId = requireParam(req.params.conversationId, 'conversationId');
    const body = req.body as SendSupportChatMessageBody;
    const data = await sendAdminMessage(conversationId, adminId, body.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** POST /admin/support/chats/:conversationId/read */
export async function postAdminChatRead(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertUserId(req);
    const conversationId = requireParam(req.params.conversationId, 'conversationId');
    const data = await markAdminRead(conversationId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** POST /admin/support/chats/:conversationId/typing */
export async function postAdminTyping(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertUserId(req);
    const conversationId = requireParam(req.params.conversationId, 'conversationId');
    const body = req.body as AdminTypingBody;
    const data = await setAdminTyping(conversationId, body.typing);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
