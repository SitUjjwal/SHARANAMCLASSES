/**
 * Zod validators for course + chapter admin mutations and list filters.
 */
import { z } from 'zod';

const classLevelEnum = z.enum([
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  'competitive',
  'computer',
]);

const courseBodyBase = z.object({
  title: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(140)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be kebab-case'),
  description: z.string().trim().max(5000).default(''),
  category_id: z.string().uuid().nullable().optional(),
  thumbnail_url: z.string().url().nullable().optional(),
  class_level: classLevelEnum.nullable().optional(),
  medium: z.enum(['hindi', 'english']).nullable().optional(),
  teacher_name: z.string().trim().max(120).nullable().optional(),
  price: z.number().min(0).optional().default(0),
  rating: z.number().min(0).max(5).optional().default(4),
  is_free: z.boolean().optional().default(false),
  is_featured: z.boolean().optional().default(false),
  /** Active = published for student app */
  is_published: z.boolean().optional().default(false),
  sort_order: z.number().int().optional().default(0),
  features: z.array(z.string().trim().min(1).max(200)).max(20).optional(),
});

function normalizePricing<T extends { is_free?: boolean; price?: number }>(data: T): T {
  if (data.is_free) {
    return { ...data, price: 0 };
  }
  return data;
}

export const createCourseSchema = courseBodyBase.transform(normalizePricing);

export const updateCourseSchema = courseBodyBase.partial().transform(normalizePricing);

export const createChapterSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(4000).default(''),
  sort_order: z.number().int().optional().default(0),
  video_url: z.string().url().nullable().optional(),
  duration_seconds: z.number().int().min(0).optional().default(0),
  video_count: z.number().int().min(0).optional().default(0),
  pdf_count: z.number().int().min(0).optional().default(0),
  notes_count: z.number().int().min(0).optional().default(0),
  is_free_preview: z.boolean().optional().default(false),
  is_published: z.boolean().optional().default(true),
});

/** Flat POST /chapters — course_id in body */
export const createChapterWithCourseSchema = createChapterSchema.extend({
  course_id: z.string().uuid(),
});

export const updateChapterSchema = createChapterSchema.partial();

export const adminListChaptersQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  courseId: z.string().uuid().optional(),
});

export const reorderChaptersSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1).max(200),
});

export const listCoursesQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  categoryId: z.string().uuid().optional(),
  featured: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  classLevel: z.string().trim().max(32).optional(),
  medium: z.enum(['hindi', 'english']).optional(),
  price: z.enum(['free', 'paid', 'all']).optional().default('all'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
});

/** Admin catalog list — includes unpublished (inactive) courses */
export const adminListCoursesQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  categoryId: z.string().uuid().optional(),
  /** active = published, inactive = draft/unpublished */
  status: z.enum(['all', 'active', 'inactive']).optional().default('all'),
  price: z.enum(['free', 'paid', 'all']).optional().default('all'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
});

/** GET /courses — student + admin shared query */
export const getCoursesQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  categoryId: z.string().uuid().optional(),
  featured: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  classLevel: z.string().trim().max(32).optional(),
  medium: z.enum(['hindi', 'english']).optional(),
  price: z.enum(['free', 'paid', 'all']).optional().default('all'),
  status: z.enum(['all', 'active', 'inactive']).optional().default('all'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export const reorderChaptersFlatSchema = z.object({
  courseId: z.string().uuid(),
  orderedIds: z.array(z.string().uuid()).min(1).max(200),
});

const chapterContentBodySchema = z.object({
  content_type: z.enum(['video', 'pdf', 'note']),
  title: z.string().trim().min(2).max(200),
  url: z.string().url().nullable().optional(),
  body: z.string().trim().max(20000).nullable().optional(),
  duration_seconds: z.number().int().min(0).nullable().optional(),
  sort_order: z.number().int().optional().default(0),
});

export const createChapterContentSchema = chapterContentBodySchema.superRefine((data, ctx) => {
  if (data.content_type === 'video' || data.content_type === 'pdf') {
    if (!data.url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'URL is required for video and PDF',
        path: ['url'],
      });
    }
  }
  if (data.content_type === 'note' && !data.body?.trim() && !data.url) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Notes need body text or a URL',
      path: ['body'],
    });
  }
});

export const updateChapterContentSchema = chapterContentBodySchema.partial();

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CreateChapterInput = z.infer<typeof createChapterSchema>;
export type CreateChapterWithCourseInput = z.infer<typeof createChapterWithCourseSchema>;
export type UpdateChapterInput = z.infer<typeof updateChapterSchema>;
export type ListCoursesQuery = z.infer<typeof listCoursesQuerySchema>;
export type AdminListCoursesQuery = z.infer<typeof adminListCoursesQuerySchema>;
export type AdminListChaptersQuery = z.infer<typeof adminListChaptersQuerySchema>;
export type ReorderChaptersInput = z.infer<typeof reorderChaptersSchema>;
export type CreateChapterContentInput = z.infer<typeof createChapterContentSchema>;
export type UpdateChapterContentInput = z.infer<typeof updateChapterContentSchema>;
