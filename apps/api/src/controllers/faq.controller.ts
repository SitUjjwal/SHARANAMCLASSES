/**
 * FAQ HTTP handlers.
 */
import type { NextFunction, Request, Response } from 'express';

import {
  createFaq,
  deleteFaq,
  listAdminFaqs,
  listPublishedFaqs,
  reorderFaqs,
  updateFaq,
} from '../services/faq.service';
import { AppError } from '../utils/AppError';
import { requireParam } from '../utils/params';
import type {
  CreateFaqBody,
  ReorderFaqsBody,
  UpdateFaqBody,
} from '../validators/faq.validators';

function assertUserId(req: Request): string {
  if (!req.user?.id) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  return req.user.id;
}

/** GET /faqs?q= */
export async function listFaqsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertUserId(req);
    const q = String((req.query as { q?: string }).q ?? '');
    const data = await listPublishedFaqs(q);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /admin/faqs */
export async function listAdminFaqsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertUserId(req);
    const data = await listAdminFaqs();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** POST /admin/faqs */
export async function postFaq(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const adminId = assertUserId(req);
    const body = req.body as CreateFaqBody;
    const data = await createFaq(body, adminId);
    res.status(201).json({ success: true, data, message: 'FAQ created' });
  } catch (error) {
    next(error);
  }
}

/** PATCH /admin/faqs/:faqId */
export async function patchFaq(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertUserId(req);
    const faqId = requireParam(req.params.faqId, 'faqId');
    const body = req.body as UpdateFaqBody;
    const data = await updateFaq(faqId, body);
    res.status(200).json({ success: true, data, message: 'FAQ updated' });
  } catch (error) {
    next(error);
  }
}

/** DELETE /admin/faqs/:faqId */
export async function deleteFaqHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertUserId(req);
    const faqId = requireParam(req.params.faqId, 'faqId');
    await deleteFaq(faqId);
    res.status(200).json({ success: true, data: null, message: 'FAQ deleted' });
  } catch (error) {
    next(error);
  }
}

/** PUT /admin/faqs/reorder */
export async function putReorderFaqs(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertUserId(req);
    const body = req.body as ReorderFaqsBody;
    const data = await reorderFaqs(body.ordered_ids);
    res.status(200).json({ success: true, data, message: 'FAQs reordered' });
  } catch (error) {
    next(error);
  }
}
