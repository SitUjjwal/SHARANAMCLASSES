/**
 * PDF HTTP handlers — admin flat REST + R2 upload.
 */
import type { NextFunction, Request, Response } from 'express';

import {
  createPdf,
  deletePdf,
  getPdfForAdmin,
  listPdfsForAdmin,
  updatePdf,
} from '../services/pdf.service';
import { uploadPdfFile } from '../services/pdf-upload.service';
import type {
  CreatePdfInput,
  ListPdfsQuery,
  UpdatePdfInput,
} from '../validators/pdf.validators';
import { AppError } from '../utils/AppError';
import { requireParam } from '../utils/params';

/** GET /pdfs */
export async function listPdfs(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const filters = req.query as unknown as ListPdfsQuery;
    const data = await listPdfsForAdmin(filters);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /pdfs/:id */
export async function getPdf(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const pdfId = requireParam(req.params.id, 'id');
    const data = await getPdfForAdmin(pdfId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** POST /pdfs */
export async function postPdf(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = req.body as CreatePdfInput;
    const data = await createPdf(input);
    res.status(201).json({ success: true, data, message: 'PDF created' });
  } catch (error) {
    next(error);
  }
}

/** PUT /pdfs/:id */
export async function putPdf(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const pdfId = requireParam(req.params.id, 'id');
    const input = req.body as UpdatePdfInput;
    const data = await updatePdf(pdfId, input);
    res.status(200).json({ success: true, data, message: 'PDF updated' });
  } catch (error) {
    next(error);
  }
}

/** DELETE /pdfs/:id */
export async function removePdf(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const pdfId = requireParam(req.params.id, 'id');
    await deletePdf(pdfId);
    res.status(200).json({ success: true, data: null, message: 'PDF deleted' });
  } catch (error) {
    next(error);
  }
}

/** POST /pdfs/upload — multipart field `file` (PDF only) */
export async function postPdfUpload(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const file = req.file;
    if (!file) {
      throw new AppError(400, 'PDF_REQUIRED', 'Attach a PDF as field "file"');
    }
    const data = await uploadPdfFile(file);
    res.status(200).json({
      success: true,
      data,
      message: 'PDF uploaded',
    });
  } catch (error) {
    next(error);
  }
}
