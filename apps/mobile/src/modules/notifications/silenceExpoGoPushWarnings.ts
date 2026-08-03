/**
 * Expo Go (SDK 53+) logs a console.error when expo-notifications loads
 * because remote Android push was removed from Expo Go. Suppress that
 * LogBox noise — inbox still works; real push needs a dev/prod build.
 */
import { LogBox } from 'react-native';

import { isExpoGo } from '@/modules/notifications/pushEnvironment';

if (__DEV__ && isExpoGo()) {
  LogBox.ignoreLogs([
    'expo-notifications: Android Push notifications',
    '`expo-notifications` functionality is not fully supported in Expo Go',
  ]);
}
