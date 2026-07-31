/**
 * Zod validators for notes admin CRUD + list filters.
 */
import { z } from 'zod';

import { isSafeNotesUrl } from '../utils/notesUrl';

const notesUrlField = z
  .string()
  .trim()
  .min(12)
  .max(2000)
  .refine((value) => isSafeNotesUrl(value), {
    message: 'Notes URL must be a valid public HTTPS link (no http, javascript, or private hosts).',
  });

export const createNoteSchema = z.object({
  course_id: z.string().uuid(),
  chapter_id: z.string().uuid(),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(4000).optional().default(''),
  notes_url: notesUrlField,
  sort_order: z.number().int().optional().default(0),
  is_free: z.boolean().optional().default(false),
  is_published: z.boolean().optional().default(true),
});

export const updateNoteSchema = createNoteSchema.partial();

export const listNotesQuerySchema = z.object({
  courseId: z.string().uuid().optional(),
  chapterId: z.string().uuid().optional(),
  search: z.string().trim().max(120).optional(),
  access: z.enum(['free', 'paid', 'all']).optional().default('all'),
  status: z.enum(['all', 'published', 'draft']).optional().default('all'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type ListNotesQuery = z.infer<typeof listNotesQuerySchema>;
