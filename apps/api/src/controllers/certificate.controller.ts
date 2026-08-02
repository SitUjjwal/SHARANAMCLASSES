/**
 * Certificate HTTP handlers — student + admin approval workflow.
 */
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

import {
  approveCertificate,
  createAdminCertificate,
  getCertificateForUser,
  listAdminCertificates,
  listCertificatesForUser,
  rejectCertificate,
  requestCertificateAfterCompletion,
  searchStudentsForAdmin,
  updateAdminCertificate,
} from '../services/certificate.service';
import { requireParam } from '../utils/params';
import { AppError } from '../utils/AppError';
import type { CertificateStatus } from '@sharanam/shared';

function assertUserId(req: Request): string {
  if (!req.user?.id) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  return req.user.id;
}

export const requestCertificateSchema = z
  .object({
    course_id: z.string().uuid('course_id must be a UUID'),
  })
  .strict();

export const rejectCertificateSchema = z
  .object({
    reason: z.string().trim().max(500).optional(),
  })
  .strict();

export const createCertificateSchema = z
  .object({
    user_id: z.string().uuid('user_id must be a UUID'),
    course_id: z.string().uuid('course_id must be a UUID').nullable().optional(),
    student_name: z.string().trim().min(1).max(120).optional(),
    course_title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(1000).optional(),
    issue_now: z.boolean().optional().default(true),
  })
  .strict()
  .refine((v) => Boolean(v.course_id) || Boolean(v.course_title?.trim()), {
    message: 'Provide course_id or course_title',
    path: ['course_title'],
  });

export const studentSearchQuerySchema = z.object({
  q: z.string().trim().optional().default(''),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const updateCertificateSchema = z
  .object({
    student_name: z.string().trim().min(1).max(120).optional(),
    course_title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(1000).optional(),
    regenerate_pdf: z.boolean().optional(),
  })
  .strict()
  .refine(
    (v) =>
      v.student_name !== undefined ||
      v.course_title !== undefined ||
      v.description !== undefined,
    { message: 'Provide at least one field to update' },
  );

/** GET /certificates */
export async function listCertificates(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const data = await listCertificatesForUser(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /certificates/:certificateId */
export async function getCertificate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const certificateId = requireParam(req.params.certificateId, 'certificateId');
    const data = await getCertificateForUser(userId, certificateId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** POST /certificates/request — after course completion */
export async function postRequestCertificate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = assertUserId(req);
    const { course_id } = req.body as { course_id: string };
    const data = await requestCertificateAfterCompletion(userId, course_id);
    res.status(201).json({
      success: true,
      data,
      message:
        data.status === 'issued'
          ? 'Certificate already issued'
          : 'Certificate requested — awaiting admin approval',
    });
  } catch (error) {
    next(error);
  }
}

/** GET /admin/certificates */
export async function listAdminCertificatesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertUserId(req);
    const status = req.query.status as CertificateStatus | undefined;
    const data = await listAdminCertificates(status ? { status } : undefined);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** POST /admin/certificates/:certificateId/approve */
export async function postApproveCertificate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const adminId = assertUserId(req);
    const certificateId = requireParam(req.params.certificateId, 'certificateId');
    const data = await approveCertificate(certificateId, adminId);
    res.status(200).json({
      success: true,
      data,
      message: 'Certificate approved and PDF generated',
    });
  } catch (error) {
    next(error);
  }
}

/** POST /admin/certificates/:certificateId/reject */
export async function postRejectCertificate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const adminId = assertUserId(req);
    const certificateId = requireParam(req.params.certificateId, 'certificateId');
    const reason = (req.body as { reason?: string })?.reason;
    const data = await rejectCertificate(certificateId, adminId, reason);
    res.status(200).json({ success: true, data, message: 'Certificate rejected' });
  } catch (error) {
    next(error);
  }
}

/** PATCH /admin/certificates/:certificateId */
export async function patchAdminCertificate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertUserId(req);
    const certificateId = requireParam(req.params.certificateId, 'certificateId');
    const body = req.body as {
      student_name?: string;
      course_title?: string;
      description?: string;
      regenerate_pdf?: boolean;
    };
    const data = await updateAdminCertificate(certificateId, body);
    res.status(200).json({
      success: true,
      data,
      message:
        data.status === 'issued'
          ? 'Certificate updated and PDF regenerated'
          : 'Certificate updated',
    });
  } catch (error) {
    next(error);
  }
}

/** GET /admin/certificates/students?q= */
export async function searchCertificateStudents(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    assertUserId(req);
    const query = req.query as unknown as { q?: string; limit?: number };
    const data = await searchStudentsForAdmin(query.q ?? '', query.limit ?? 20);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** POST /admin/certificates — create (+ optionally issue PDF) */
export async function postCreateCertificate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const adminId = assertUserId(req);
    const body = req.body as {
      user_id: string;
      course_id?: string | null;
      student_name?: string;
      course_title?: string;
      description?: string;
      issue_now?: boolean;
    };
    const data = await createAdminCertificate(adminId, body);
    res.status(201).json({
      success: true,
      data,
      message:
        data.status === 'issued'
          ? `Certificate issued ${data.certificate_number}`
          : 'Certificate created — pending approval',
    });
  } catch (error) {
    next(error);
  }
}
