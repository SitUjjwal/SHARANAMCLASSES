/**
 * Zod validators for banner admin mutations.
 * Redirect: none | course | test | live_class | website
 */
import { z } from 'zod';

const redirectTypeEnum = z.enum([
  'none',
  'course',
  'test',
  'live_class',
  'website',
]);

const optionalUrl = z
  .union([z.string().url(), z.literal(''), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    return value;
  });

const bannerBaseSchema = z.object({
  title: z.string().trim().min(2).max(120),
  subtitle: z.string().trim().max(240).nullable().optional(),
  image: z.string().url(),
  redirect_type: redirectTypeEnum.optional().default('none'),
  redirect_target_id: z.string().uuid().nullable().optional(),
  redirect_url: optionalUrl,
  status: z.enum(['active', 'inactive']).optional().default('active'),
  sort_order: z.number().int().optional().default(0),
});

function refineRedirect(
  value: {
    redirect_type?: z.infer<typeof redirectTypeEnum>;
    redirect_target_id?: string | null;
    redirect_url?: string | null;
  },
  ctx: z.RefinementCtx,
) {
  const type = value.redirect_type ?? 'none';

  if (type === 'website' && !value.redirect_url) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['redirect_url'],
      message: 'Website URL is required when redirect is Website',
    });
  }

  if (
    (type === 'course' || type === 'test' || type === 'live_class') &&
    !value.redirect_target_id
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['redirect_target_id'],
      message: `Select a ${type.replace('_', ' ')} target`,
    });
  }
}

export const createBannerSchema = bannerBaseSchema.superRefine(refineRedirect);

export const updateBannerSchema = bannerBaseSchema.partial().superRefine((value, ctx) => {
  // Only validate redirect shape when type is present on PATCH.
  if (value.redirect_type !== undefined) {
    refineRedirect(value, ctx);
  }
});

export type CreateBannerInput = z.infer<typeof createBannerSchema>;
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>;
