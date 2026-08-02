/**
 * Notification types — local mirror of shared push types + UI status.
 */
export type PushProvider = 'fcm' | 'apns' | 'expo';
export type PushPlatform = 'ios' | 'android' | 'web';

export type RegisteredPushToken = {
  deviceId: string;
  token: string;
  provider: PushProvider;
  platform: PushPlatform;
};

export type NotificationPermissionStatus =
  | 'undetermined'
  | 'granted'
  | 'denied'
  | 'unavailable';

export type NotificationRegistrationState = {
  permission: NotificationPermissionStatus;
  token: RegisteredPushToken | null;
  lastError: string | null;
  syncedAt: string | null;
};
