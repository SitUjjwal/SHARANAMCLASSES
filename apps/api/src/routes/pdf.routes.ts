/**
 * PDF REST routes (admin).
 *
 *   GET|POST          /pdfs
 *   GET|PUT|DELETE    /pdfs/:id
 *   POST              /pdfs/upload
 */
import { Router } from 'express';

import {
  getPdf,
  listPdfs,
  postPdf,
  postPdfUpload,
  putPdf,
  removePdf,
} from '../controllers/pdf.controller';
import { requireAuth } from '../middlewares/auth';
import { requirePermission } from '../middlewares/requirePermission';
import { pdfUpload } from '../middlewares/upload';
import { validate } from '../middlewares/validate';
import {
  createPdfSchema,
  listPdfsQuerySchema,
  updatePdfSchema,
} from '../validators/pdf.validators';

export const pdfRouter = Router();

pdfRouter.get(
  '/pdfs',
  requireAuth,
  requirePermission('courses:read'),
  validate(listPdfsQuerySchema, 'query'),
  listPdfs,
);

pdfRouter.post('/pdfs/upload', requireAuth, requirePermission('courses:create'), pdfUpload, postPdfUpload);

pdfRouter.post('/pdfs', requireAuth, requirePermission('courses:create'), validate(createPdfSchema), postPdf);

pdfRouter.get('/pdfs/:id', requireAuth, requirePermission('courses:read'), getPdf);

pdfRouter.put(
  '/pdfs/:id',
  requireAuth,
  requirePermission('courses:update'),
  validate(updatePdfSchema),
  putPdf,
);

pdfRouter.delete('/pdfs/:id', requireAuth, requirePermission('courses:delete'), removePdf);
