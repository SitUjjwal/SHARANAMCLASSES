/**
 * Zod validators for Notification Service (admin create / send).
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

const notificationTypeEnum = z.enum([
  'general',
  'live_class',
  'course_update',
  'test_reminder',
  'announcement',
  'course_expiry',
  'missed_class',
  'payment',
]);

const audienceTypeEnum = z.enum(['single_user', 'all_users', 'class', 'course']);

const stringDataSchema = z
  .record(z.string(), z.string())
  .optional()
  .default({});

/**
 * Create a notification campaign.
 * Default: save as draft (`send: false`). Use POST /notifications/send to push.
 */
export const createNotificationSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    body: z.string().trim().min(1).max(1000),
    deep_link: z.string().trim().max(500).nullable().optional(),
    data: stringDataSchema,
    notification_type: notificationTypeEnum.optional().default('general'),
    audience_type: audienceTypeEnum,
    audience_user_id: z.string().uuid().optional(),
    audience_class_level: classLevelEnum.optional(),
    audience_course_id: z.string().uuid().optional(),
    /** When true, resolve audience + push immediately after save. */
    send: z.boolean().optional().default(false),
  })
  .superRefine((value, ctx) => {
    if (value.audience_type === 'single_user' && !value.audience_user_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['audience_user_id'],
        message: 'audience_user_id is required for single_user',
      });
    }
    if (value.audience_type === 'class' && !value.audience_class_level) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['audience_class_level'],
        message: 'audience_class_level is required for class audience',
      });
    }
    if (value.audience_type === 'course' && !value.audience_course_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['audience_course_id'],
        message: 'audience_course_id is required for course audience',
      });
    }
  });

export const sendNotificationSchema = z
  .object({
    notification_id: z.string().uuid().optional(),
    id: z.string().uuid().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.notification_id && !value.id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['notification_id'],
        message: 'notification_id (or id) is required',
      });
    }
  });

/**
 * Update an existing campaign (title, body, audience, etc.).
 * Optional `send: true` pushes only when status is still `draft`.
 */
export const updateNotificationSchema = createNotificationSchema;

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;
export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>;
