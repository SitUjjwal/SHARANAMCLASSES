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
import { requireAdmin } from '../middlewares/requireAdmin';
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
  requireAdmin,
  validate(listPdfsQuerySchema, 'query'),
  listPdfs,
);

pdfRouter.post('/pdfs/upload', requireAuth, requireAdmin, pdfUpload, postPdfUpload);

pdfRouter.post('/pdfs', requireAuth, requireAdmin, validate(createPdfSchema), postPdf);

pdfRouter.get('/pdfs/:id', requireAuth, requireAdmin, getPdf);

pdfRouter.put(
  '/pdfs/:id',
  requireAuth,
  requireAdmin,
  validate(updatePdfSchema),
  putPdf,
);

pdfRouter.delete('/pdfs/:id', requireAuth, requireAdmin, removePdf);
