/**
 * NotificationProvider
 *
 * After the user is authenticated:
 * - request permission
 * - register FCM/APNs/Expo token
 * - sync token to API (and refresh when OS rotates it)
 * - attach foreground + response listeners
 * - handle cold-start notification tap
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Alert, AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { queryClient } from '@/api/queryClient';
import { queryKeys } from '@/api/queryKeys';
import { useAuth } from '@/hooks/useAuth';
import { registerBackgroundNotificationTask } from '@/modules/notifications/backgroundNotificationTask';
import { configureNotifications } from '@/modules/notifications/configureNotifications';
import { handleNotificationResponse } from '@/modules/notifications/handleNotificationResponse';
import {
  deactivatePushTokenOnBackend,
  syncPushTokenToBackend,
} from '@/modules/notifications/notification.service';
import { canUseRemotePush } from '@/modules/notifications/pushEnvironment';
import { registerForPushNotifications } from '@/modules/notifications/registerForPush';
import { scheduleLocalSmokeNotification } from '@/modules/notifications/scheduleLocalSmokeNotification';
import type {
  NotificationRegistrationState,
  RegisteredPushToken,
} from '@/modules/notifications/types';

type NotificationContextValue = NotificationRegistrationState & {
  refreshRegistration: () => Promise<void>;
  sendTestNotification: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

const initialState: NotificationRegistrationState = {
  permission: 'undetermined',
  token: null,
  lastError: null,
  syncedAt: null,
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<NotificationRegistrationState>(initialState);
  const tokenRef = useRef<RegisteredPushToken | null>(null);

  const refreshRegistration = useCallback(async () => {
    await configureNotifications();
    if (canUseRemotePush()) {
      await registerBackgroundNotificationTask();
    }

    const result = await registerForPushNotifications();
    setState((prev) => ({
      ...prev,
      permission: result.permission,
      token: result.token,
      lastError: result.error,
    }));

    if (!result.token || !isAuthenticated) {
      tokenRef.current = result.token;
      return;
    }

    try {
      await syncPushTokenToBackend(result.token);
      tokenRef.current = result.token;
      setState((prev) => ({
        ...prev,
        syncedAt: new Date().toISOString(),
        lastError: null,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to sync push token';
      setState((prev) => ({ ...prev, lastError: message }));
    }
  }, [isAuthenticated]);

  const sendTestNotification = useCallback(async () => {
    await configureNotifications();
    if (state.permission !== 'granted') {
      await refreshRegistration();
    }
    await scheduleLocalSmokeNotification(2);
    if (Platform.OS === 'android') {
      Alert.alert(
        'Test scheduled',
        'A local notification will appear in ~2 seconds. Put the app in background to test that path too.',
      );
    }
  }, [refreshRegistration, state.permission]);

  // Register when session becomes authenticated; deactivate on logout.
  useEffect(() => {
    if (!isAuthenticated) {
      const previous = tokenRef.current;
      tokenRef.current = null;
      setState(initialState);
      if (previous) {
        void deactivatePushTokenOnBackend(previous).catch(() => {
          // best-effort
        });
      }
      return;
    }

    void refreshRegistration();
  }, [isAuthenticated, refreshRegistration]);

  // Token refresh listener (OS may rotate FCM/APNs tokens). Skip in Expo Go.
  useEffect(() => {
    if (!canUseRemotePush()) {
      return;
    }

    const sub = Notifications.addPushTokenListener((devicePushToken) => {
      if (!isAuthenticated) return;
      const tokenValue =
        typeof devicePushToken.data === 'string'
          ? devicePushToken.data
          : String(devicePushToken.data);
      const provider = devicePushToken.type === 'ios' ? 'apns' : 'fcm';
      const current = tokenRef.current;
      if (!current) return;

      const next: RegisteredPushToken = {
        ...current,
        token: tokenValue,
        provider,
      };
      tokenRef.current = next;
      setState((prev) => ({ ...prev, token: next }));
      void syncPushTokenToBackend(next)
        .then(() => {
          setState((prev) => ({
            ...prev,
            syncedAt: new Date().toISOString(),
            lastError: null,
          }));
        })
        .catch((error: unknown) => {
          const message =
            error instanceof Error ? error.message : 'Token refresh sync failed';
          setState((prev) => ({ ...prev, lastError: message }));
        });
    });

    return () => sub.remove();
  }, [isAuthenticated]);

  // Foreground receive + tap handlers; cold-start tap.
  useEffect(() => {
    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      console.log(
        '[notifications] foreground',
        notification.request.content.title,
        notification.request.content.data,
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.notificationHistory });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notificationUnreadCount });
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(response);
      // Avoid re-processing the same cold-start response on next launch.
      if (typeof Notifications.clearLastNotificationResponseAsync === 'function') {
        void Notifications.clearLastNotificationResponseAsync();
      }
    });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleNotificationResponse(response);
        if (typeof Notifications.clearLastNotificationResponseAsync === 'function') {
          void Notifications.clearLastNotificationResponseAsync();
        }
      }
    });

    const appStateSub = AppState.addEventListener('change', (next) => {
      // Re-sync when returning to foreground (covers permission changes).
      if (next === 'active' && isAuthenticated) {
        void refreshRegistration();
      }
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
      appStateSub.remove();
    };
  }, [isAuthenticated, refreshRegistration]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      ...state,
      refreshRegistration,
      sendTestNotification,
    }),
    [state, refreshRegistration, sendTestNotification],
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return ctx;
}
