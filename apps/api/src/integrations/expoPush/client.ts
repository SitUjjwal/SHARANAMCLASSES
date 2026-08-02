/**
 * Expo Push API helper.
 *
 * Why: Expo Go / Expo-managed tokens cannot be sent via Firebase Admin.
 * Production native FCM tokens still go through integrations/fcm/client.ts.
 */
import type { PushMessagePayload } from '../fcm/client';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const CHUNK = 100;

export type ExpoPushSendResult = {
  successCount: number;
  failureCount: number;
  failedTokens: string[];
};

function isExpoToken(token: string): boolean {
  return token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[');
}

export async function sendExpoPushToTokens(
  tokens: string[],
  payload: PushMessagePayload,
): Promise<ExpoPushSendResult> {
  const unique = [...new Set(tokens.filter((t) => t && isExpoToken(t)))];
  if (!unique.length) {
    return { successCount: 0, failureCount: 0, failedTokens: [] };
  }

  const data: Record<string, string> = { ...(payload.data ?? {}) };
  if (payload.deepLink) data.deepLink = payload.deepLink;

  const messages = unique.map((to) => ({
    to,
    title: payload.title,
    body: payload.body,
    data,
    sound: 'default' as const,
    priority: 'high' as const,
  }));

  let successCount = 0;
  let failureCount = 0;
  const failedTokens: string[] = [];

  for (let i = 0; i < messages.length; i += CHUNK) {
    const chunk = messages.slice(i, i + CHUNK);
    const tokenChunk = unique.slice(i, i + CHUNK);

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });

      if (!response.ok) {
        failureCount += chunk.length;
        failedTokens.push(...tokenChunk);
        continue;
      }

      const json = (await response.json()) as {
        data?: Array<{ status: string; message?: string }>;
      };
      const tickets = json.data ?? [];

      tickets.forEach((ticket, index) => {
        const token = tokenChunk[index];
        if (ticket?.status === 'ok') {
          successCount += 1;
        } else {
          failureCount += 1;
          if (token) failedTokens.push(token);
        }
      });
    } catch {
      failureCount += chunk.length;
      failedTokens.push(...tokenChunk);
    }
  }

  return { successCount, failureCount, failedTokens };
}
