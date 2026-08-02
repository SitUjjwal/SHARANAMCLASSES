/**
 * Firebase Cloud Messaging (FCM) admin client.
 *
 * Why: single place to send Android/iOS push via Firebase Admin SDK.
 * Security: credentials stay on the API server only (never in mobile/admin).
 *
 * Env (pick one):
 * - FIREBASE_SERVICE_ACCOUNT_JSON  → raw JSON string of the service account
 * - FIREBASE_SERVICE_ACCOUNT_PATH  → absolute/relative path to the JSON file
 * - GOOGLE_APPLICATION_CREDENTIALS → standard Google ADC path (also works)
 *
 * Future: live-class / test-reminder / announcement fan-out call `sendToTokens`.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { cert, getApps, initializeApp, type App, type ServiceAccount } from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';

import { env } from '../../config/env';

export type PushMessagePayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
  /** Deep link path, e.g. sharanam://live or /tests */
  deepLink?: string;
};

let messaging: Messaging | null = null;
let initAttempted = false;

function loadServiceAccount(): ServiceAccount | null {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (rawJson) {
    return JSON.parse(rawJson) as ServiceAccount;
  }

  const path =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim() ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (path) {
    const absolute = resolve(path);
    return JSON.parse(readFileSync(absolute, 'utf8')) as ServiceAccount;
  }

  return null;
}

function getAppMessaging(): Messaging | null {
  if (messaging) {
    return messaging;
  }
  if (initAttempted) {
    return null;
  }
  initAttempted = true;

  try {
    const account = loadServiceAccount();
    if (!account) {
      if (env.NODE_ENV !== 'test') {
        console.warn(
          '[fcm] No Firebase credentials — push send is disabled. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH.',
        );
      }
      return null;
    }

    const app: App =
      getApps().length > 0
        ? getApps()[0]!
        : initializeApp({
            credential: cert(account),
          });

    messaging = getMessaging(app);
    return messaging;
  } catch (error) {
    console.error('[fcm] Failed to initialize Firebase Admin', error);
    return null;
  }
}

export function isFcmConfigured(): boolean {
  return Boolean(getAppMessaging());
}

/**
 * Send a notification to one or more FCM device tokens.
 * Returns tokens that failed so callers can deactivate them.
 */
export async function sendToTokens(
  tokens: string[],
  payload: PushMessagePayload,
): Promise<{ successCount: number; failureCount: number; failedTokens: string[] }> {
  const unique = [...new Set(tokens.filter(Boolean))];
  if (!unique.length) {
    return { successCount: 0, failureCount: 0, failedTokens: [] };
  }

  const client = getAppMessaging();
  if (!client) {
    return {
      successCount: 0,
      failureCount: unique.length,
      failedTokens: unique,
    };
  }

  const data: Record<string, string> = {
    ...(payload.data ?? {}),
  };
  if (payload.deepLink) {
    data.deepLink = payload.deepLink;
  }

  const response = await client.sendEachForMulticast({
    tokens: unique,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data,
    android: {
      priority: 'high',
      notification: {
        channelId: 'default',
        sound: 'default',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
  });

  const failedTokens: string[] = [];
  response.responses.forEach((result, index) => {
    if (!result.success) {
      const token = unique[index];
      if (token) failedTokens.push(token);
    }
  });

  return {
    successCount: response.successCount,
    failureCount: response.failureCount,
    failedTokens,
  };
}

/** Back-compat stub shape used by earlier modules. */
export const fcmClient = {
  isConfigured: isFcmConfigured,
  sendToTokens,
} as const;
