import 'react-native-gesture-handler';

// Mute Expo Go push LogBox before expo-notifications side effects run.
import '@/modules/notifications/silenceExpoGoPushWarnings';

// Background FCM/APNs task must register before the root component mounts.
import '@/modules/notifications/backgroundNotificationTask';

import { registerRootComponent } from 'expo';

import App from './App';

registerRootComponent(App);
