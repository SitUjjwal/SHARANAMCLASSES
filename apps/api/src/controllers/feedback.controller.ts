/**
 * Student feedback ticket HTTP handlers.
 */
import type { NextFunction, Request, Response } from 'express';

import {
  createFeedbackTicket,
  deleteAdminFeedbackTicket,
  deleteMyFeedbackTicket,
  getMyFeedbackTicket,
  listAdminFeedbackTickets,
  listFeedbackTeachers,
  listMyFeedbackTickets,
  updateFeedbackTicketStatus,
  updateMyFeedbackTicket,
} from '../services/feedback.service';
import { AppError } from '../utils/AppError';
import { requireParam } from '../utils/params';
import type {
  CreateFeedbackInput,
  UpdateFeedbackContentInput,
  UpdateFeedbackStatusInput,
} from '../validators/feedback.validators';
import type { FeedbackTicketStatus, FeedbackType } from '@sharanam/shared';

function assertUserId(req: Request): string {
  if (!req.user?.id) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  return req.user.id;
}

/** POST /feedback */
export async function postCreateFeedback(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const body = req.body as CreateFeedbackInput;
    const data = await createFeedbackTicket(userId, body);
    res.status(201).json({
      success: true,
      data,
      message: 'Feedback submitted',
    });
  } catch (error) {
    next(error);
  }
}

/** GET /feedback */
export async function listMyFeedback(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const data = await listMyFeedbackTickets(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /feedback/:feedbackId */
export async function getMyFeedback(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const feedbackId = requireParam(req.params.feedbackId, 'feedbackId');
    const data = await getMyFeedbackTicket(userId, feedbackId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** PATCH /feedback/:feedbackId — student edit (open only) */
export async function patchMyFeedback(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const feedbackId = requireParam(req.params.feedbackId, 'feedbackId');
    const body = req.body as UpdateFeedbackContentInput;
    const data = await updateMyFeedbackTicket(userId, feedbackId, body);
    res.status(200).json({ success: true, data, message: 'Feedback updated' });
  } catch (error) {
    next(error);
  }
}

/** DELETE /feedback/:feedbackId — student delete (open only) */
export async function deleteMyFeedbackHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const feedbackId = requireParam(req.params.feedbackId, 'feedbackId');
    await deleteMyFeedbackTicket(userId, feedbackId);
    res.status(200).json({ success: true, data: null, message: 'Feedback deleted' });
  } catch (error) {
    next(error);
  }
}

/** GET /feedback/teachers */
export async function listFeedbackTeachersHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertUserId(req);
    const data = await listFeedbackTeachers();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /admin/feedback */
export async function listAdminFeedbackHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const q = req.query as {
      status?: FeedbackTicketStatus;
      feedback_type?: FeedbackType;
    };
    const data = await listAdminFeedbackTickets({
      status: q.status,
      feedback_type: q.feedback_type,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** PATCH /admin/feedback/:feedbackId */
export async function patchAdminFeedback(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const adminId = assertUserId(req);
    const feedbackId = requireParam(req.params.feedbackId, 'feedbackId');
    const body = req.body as UpdateFeedbackStatusInput;
    const data = await updateFeedbackTicketStatus(feedbackId, body, adminId);
    res.status(200).json({ success: true, data, message: 'Ticket updated' });
  } catch (error) {
    next(error);
  }
}

/** DELETE /admin/feedback/:feedbackId */
export async function deleteAdminFeedbackHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertUserId(req);
    const feedbackId = requireParam(req.params.feedbackId, 'feedbackId');
    await deleteAdminFeedbackTicket(feedbackId);
    res.status(200).json({ success: true, data: null, message: 'Ticket deleted' });
  } catch (error) {
    next(error);
  }
}
