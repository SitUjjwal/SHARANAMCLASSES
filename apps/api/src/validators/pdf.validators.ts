/**
 * Zod validators for PDF admin CRUD + list filters + upload metadata.
 */
import { z } from 'zod';

const fileUrlField = z.string().trim().url().max(2000);
const storageKeyField = z.string().trim().min(3).max(500);

export const createPdfSchema = z.object({
  course_id: z.string().uuid(),
  chapter_id: z.string().uuid(),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(4000).optional().default(''),
  file_url: fileUrlField,
  storage_key: storageKeyField,
  file_size: z.number().int().min(1).max(25 * 1024 * 1024),
  mime_type: z.literal('application/pdf').optional().default('application/pdf'),
  original_filename: z.string().trim().min(1).max(180),
  sort_order: z.number().int().optional().default(0),
  is_free: z.boolean().optional().default(false),
  is_published: z.boolean().optional().default(true),
});

export const updatePdfSchema = z
  .object({
    course_id: z.string().uuid().optional(),
    chapter_id: z.string().uuid().optional(),
    title: z.string().trim().min(2).max(160).optional(),
    description: z.string().trim().max(4000).optional(),
    file_url: fileUrlField.optional(),
    storage_key: storageKeyField.optional(),
    file_size: z.number().int().min(1).max(25 * 1024 * 1024).optional(),
    mime_type: z.literal('application/pdf').optional(),
    original_filename: z.string().trim().min(1).max(180).optional(),
    sort_order: z.number().int().optional(),
    is_free: z.boolean().optional(),
    is_published: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    const hasUrl = value.file_url !== undefined;
    const hasKey = value.storage_key !== undefined;
    if (hasUrl !== hasKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'file_url and storage_key must be updated together (from /pdfs/upload)',
        path: ['file_url'],
      });
    }
  });

export const listPdfsQuerySchema = z.object({
  courseId: z.string().uuid().optional(),
  chapterId: z.string().uuid().optional(),
  search: z.string().trim().max(120).optional(),
  access: z.enum(['free', 'paid', 'all']).optional().default('all'),
  status: z.enum(['all', 'published', 'draft']).optional().default('all'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type CreatePdfInput = z.infer<typeof createPdfSchema>;
export type UpdatePdfInput = z.infer<typeof updatePdfSchema>;
export type ListPdfsQuery = z.infer<typeof listPdfsQuerySchema>;
