/**
 * scheduleLocalSmokeNotification.ts
 *
 * Schedules a local notification so we can verify permission + foreground/
 * background handlers without Firebase credentials.
 */
import * as Notifications from 'expo-notifications';

export async function scheduleLocalSmokeNotification(
  seconds = 3,
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'SHARANAM CLASSES',
      body: 'Notifications are working ✅',
      data: {
        type: 'announcement',
        deepLink: 'sharanam://home',
      },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      channelId: 'default',
    },
  });
}
