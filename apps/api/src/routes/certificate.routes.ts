/**
 * Certificate routes — student list/request + admin create/approve/reject/edit.
 *
 *   GET  /certificates
 *   GET  /certificates/:certificateId
 *   POST /certificates/request
 *   GET   /admin/certificates
 *   GET   /admin/certificates/students
 *   POST  /admin/certificates
 *   POST  /admin/certificates/:certificateId/approve
 *   POST  /admin/certificates/:certificateId/reject
 *   PATCH /admin/certificates/:certificateId
 */
import { Router } from 'express';

import {
  createCertificateSchema,
  getCertificate,
  listAdminCertificatesHandler,
  listCertificates,
  patchAdminCertificate,
  postApproveCertificate,
  postCreateCertificate,
  postRejectCertificate,
  postRequestCertificate,
  rejectCertificateSchema,
  requestCertificateSchema,
  searchCertificateStudents,
  studentSearchQuerySchema,
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
certificateRouter.get(
  '/admin/certificates/students',
  requireAuth,
  requireAdmin,
  validate(studentSearchQuerySchema, 'query'),
  searchCertificateStudents,
);
certificateRouter.post(
  '/admin/certificates',
  requireAuth,
  requireAdmin,
  validate(createCertificateSchema),
  postCreateCertificate,
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
