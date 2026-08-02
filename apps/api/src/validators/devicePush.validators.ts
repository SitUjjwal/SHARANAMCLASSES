/**
 * Device push-token validators (FCM / APNs / Expo).
 */
import { z } from 'zod';

export const upsertPushTokenSchema = z.object({
  device_id: z.string().trim().min(4).max(200),
  token: z.string().trim().min(8).max(512),
  provider: z.enum(['fcm', 'apns', 'expo']),
  platform: z.enum(['ios', 'android', 'web']),
  app_version: z.string().trim().max(40).nullable().optional(),
});

export const deactivatePushTokenSchema = z.object({
  device_id: z.string().trim().min(4).max(200).optional(),
  token: z.string().trim().min(8).max(512).optional(),
}).refine((body) => Boolean(body.device_id || body.token), {
  message: 'Provide device_id or token',
});

export type UpsertPushTokenInput = z.infer<typeof upsertPushTokenSchema>;
export type DeactivatePushTokenInput = z.infer<typeof deactivatePushTokenSchema>;
