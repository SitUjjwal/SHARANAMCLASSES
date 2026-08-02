/**
 * backgroundNotificationTask.ts
 *
 * Why: Android/iOS can deliver remote notifications while the JS app is
 * backgrounded or killed. Expo invokes this task so we can log/handle data.
 *
 * Must be imported from `index.ts` BEFORE the root component registers,
 * so TaskManager.defineTask runs at module load time.
 */
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

export const BACKGROUND_NOTIFICATION_TASK = 'SHARANAM_BACKGROUND_NOTIFICATION_TASK';

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('[notifications] background task error', error);
    return;
  }

  // data.notification is present for notification-type messages
  const notification = (data as { notification?: Notifications.Notification } | undefined)
    ?.notification;
  if (notification) {
    console.log(
      '[notifications] background/killed delivery',
      notification.request.content.title,
      notification.request.content.data,
    );
  }
});

export async function registerBackgroundNotificationTask(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);
    if (!isRegistered) {
      await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
    }
  } catch (error) {
    // Simulators / web / Expo Go may not support background tasks.
    console.warn('[notifications] background task registration skipped', error);
  }
}
