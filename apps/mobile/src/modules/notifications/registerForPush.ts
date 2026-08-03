/**
 * registerForPush.ts
 *
 * Production registration flow:
 * 1) Physical device check
 * 2) Configure channels + foreground handler
 * 3) Request OS permission
 * 4) Prefer native device token (FCM on Android, APNs on iOS)
 * 5) Fall back to Expo push token when native token is unavailable (Expo Go / missing google-services)
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import { configureNotifications } from '@/modules/notifications/configureNotifications';
import { canUseRemotePush } from '@/modules/notifications/pushEnvironment';
import { getStableDeviceId } from '@/modules/notifications/stableDeviceId';
import type {
  NotificationPermissionStatus,
  RegisteredPushToken,
} from '@/modules/notifications/types';

function mapPermission(
  status: Notifications.PermissionStatus,
): NotificationPermissionStatus {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

function resolvePlatform(): RegisteredPushToken['platform'] {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}

function resolveExpoProjectId(): string | undefined {
  return (
    Constants.easConfig?.projectId ??
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas
      ?.projectId
  );
}

export { getStableDeviceId };

export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  await configureNotifications();

  if (!Device.isDevice) {
    return 'unavailable';
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return 'granted';
  }

  const asked = await Notifications.requestPermissionsAsync();
  return mapPermission(asked.status);
}

/**
 * Obtain the best available push token for this install.
 */
export async function registerForPushNotifications(): Promise<{
  permission: NotificationPermissionStatus;
  token: RegisteredPushToken | null;
  error: string | null;
}> {
  await configureNotifications();

  if (!Device.isDevice) {
    return {
      permission: 'unavailable',
      token: null,
      error: 'Push tokens require a physical device (not a simulator/emulator).',
    };
  }

  // Expo Go (SDK 53+) removed Android remote push — skip token APIs to avoid redbox.
  if (!canUseRemotePush()) {
    return {
      permission: 'unavailable',
      token: null,
      error:
        'Remote push needs a development build. Notification inbox still works in Expo Go.',
    };
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    return {
      permission,
      token: null,
      error: 'Notification permission was not granted.',
    };
  }

  const deviceId = await getStableDeviceId();
  const platform = resolvePlatform();

  // 1) Native FCM / APNs token (production / dev builds with google-services / APNs)
  try {
    const devicePush = await Notifications.getDevicePushTokenAsync();
    const tokenValue =
      typeof devicePush.data === 'string' ? devicePush.data : String(devicePush.data);
    const provider: RegisteredPushToken['provider'] =
      devicePush.type === 'ios' ? 'apns' : 'fcm';

    return {
      permission,
      token: {
        deviceId,
        token: tokenValue,
        provider,
        platform,
      },
      error: null,
    };
  } catch (nativeError) {
    console.warn(
      '[notifications] native device token unavailable, trying Expo push token',
      nativeError,
    );
  }

  // 2) Expo push token (EAS projectId)
  try {
    const projectId = resolveExpoProjectId();
    const expoPush = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return {
      permission,
      token: {
        deviceId,
        token: expoPush.data,
        provider: 'expo',
        platform,
      },
      error: null,
    };
  } catch (expoError) {
    const message =
      expoError instanceof Error ? expoError.message : 'Failed to obtain push token';
    return {
      permission,
      token: null,
      error: message,
    };
  }
}
