/**
 * Expo Go (SDK 53+) logs a console.error when expo-notifications loads
 * because remote Android push was removed from Expo Go. Suppress that
 * noise — inbox still works; real push needs a dev/prod build.
 *
 * Avoid static `LogBox` import: on web Metro resolves it to
 * `react-native-web/dist/exports/LogBox`, which does not exist.
 */
import { Platform } from 'react-native';

import { isExpoGo } from '@/modules/notifications/pushEnvironment';

const PUSH_NOISE =
  /expo-notifications|Android Push notifications|not fully supported in Expo Go/i;

function shouldMute(...args: unknown[]): boolean {
  const text = args
    .map((a) => (typeof a === 'string' ? a : a instanceof Error ? a.message : ''))
    .join(' ');
  return PUSH_NOISE.test(text);
}

if (__DEV__ && isExpoGo()) {
  const originalError = console.error.bind(console);
  const originalWarn = console.warn.bind(console);

  console.error = (...args: unknown[]) => {
    if (shouldMute(...args)) return;
    originalError(...args);
  };
  console.warn = (...args: unknown[]) => {
    if (shouldMute(...args)) return;
    originalWarn(...args);
  };

  if (Platform.OS !== 'web') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { LogBox } = require('react-native') as typeof import('react-native');
      LogBox.ignoreLogs([
        'expo-notifications: Android Push notifications',
        '`expo-notifications` functionality is not fully supported in Expo Go',
      ]);
    } catch {
      // LogBox unavailable (e.g. unusual bundler target)
    }
  }
}
