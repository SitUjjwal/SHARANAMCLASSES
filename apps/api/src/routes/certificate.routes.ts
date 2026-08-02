/**
 * Certificate routes — student list/request + admin approve/reject/edit.
 *
 *   GET  /certificates
 *   GET  /certificates/:certificateId
 *   POST /certificates/request
 *   GET   /admin/certificates
 *   POST  /admin/certificates/:certificateId/approve
 *   POST  /admin/certificates/:certificateId/reject
 *   PATCH /admin/certificates/:certificateId
 */
import { Router } from 'express';

import {
  getCertificate,
  listAdminCertificatesHandler,
  listCertificates,
  patchAdminCertificate,
  postApproveCertificate,
  postRejectCertificate,
  postRequestCertificate,
  rejectCertificateSchema,
  requestCertificateSchema,
  updateCertificateSchema,
} from '../controllers/certificate.controller';
import { requireAuth } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/requireAdmin';
import { validate } from '../middlewares/validate';

export const certificateRouter = Router();

certificateRouter.get('/certificates', requireAuth, listCertificates);
certificateRouter.get('/certificates/:certificateId', requireAuth, getCertificate);
certificateRouter.post(
  '/certificates/request',
  requireAuth,
  validate(requestCertificateSchema),
  postRequestCertificate,
);

certificateRouter.get(
  '/admin/certificates',
  requireAuth,
  requireAdmin,
  listAdminCertificatesHandler,
);
certificateRouter.post(
  '/admin/certificates/:certificateId/approve',
  requireAuth,
  requireAdmin,
  postApproveCertificate,
);
certificateRouter.post(
  '/admin/certificates/:certificateId/reject',
  requireAuth,
  requireAdmin,
  validate(rejectCertificateSchema),
  postRejectCertificate,
);
certificateRouter.patch(
  '/admin/certificates/:certificateId',
  requireAuth,
  requireAdmin,
  validate(updateCertificateSchema),
  patchAdminCertificate,
);
