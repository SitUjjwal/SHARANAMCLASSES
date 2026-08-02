/**
 * stableDeviceId.ts — one UUID per app install, kept in SecureStore.
 * Why: FCM token upserts key off (user_id, device_id); must not change every launch.
 */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'sharanam.device_id';

function createId(): string {
  // RN / Hermes: crypto.randomUUID may exist; fallback is fine for install id.
  const randomUuid =
    globalThis.crypto && 'randomUUID' in globalThis.crypto
      ? globalThis.crypto.randomUUID()
      : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${Platform.OS}-${randomUuid}`;
}

export async function getStableDeviceId(): Promise<string> {
  try {
    const existing = await SecureStore.getItemAsync(KEY);
    if (existing) {
      return existing;
    }
    const next = createId();
    await SecureStore.setItemAsync(KEY, next);
    return next;
  } catch {
    return createId();
  }
}
