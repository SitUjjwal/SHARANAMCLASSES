/**
 * configureNotifications.ts
 *
 * Sets how notifications behave when the app is FOREGROUNDED.
 * Background/killed display is handled by the OS + FCM; we only configure
 * whether to show an alert/sound/badge while React Native is active.
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

let configured = false;

export async function configureNotifications(): Promise<void> {
  if (configured) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  if (Platform.OS === 'android') {
    // Android 13+ will not prompt for permission until at least one channel exists.
    await Notifications.setNotificationChannelAsync('default', {
      name: 'General',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C9A227',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('live-classes', {
      name: 'Live Classes',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('tests', {
      name: 'Tests & Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }

  configured = true;
}
