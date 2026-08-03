/**
 * Detect Expo Go so we can skip remote push APIs removed in SDK 53+.
 * Inbox / local UI still works; FCM needs a development or production build.
 */
import { isRunningInExpoGo } from 'expo';

export function isExpoGo(): boolean {
  return isRunningInExpoGo();
}

/** Remote push tokens (FCM/APNs/Expo) are unavailable in Expo Go on Android (SDK 53+). */
export function canUseRemotePush(): boolean {
  return !isExpoGo();
}
