/**
 * Zod validators for support chat.
 */
import { z } from 'zod';

export const sendSupportChatMessageSchema = z
  .object({
    body: z.string().trim().min(1).max(4000),
  })
  .strict();

export const adminTypingSchema = z
  .object({
    typing: z.boolean(),
  })
  .strict();

export type SendSupportChatMessageBody = z.infer<typeof sendSupportChatMessageSchema>;
export type AdminTypingBody = z.infer<typeof adminTypingSchema>;
