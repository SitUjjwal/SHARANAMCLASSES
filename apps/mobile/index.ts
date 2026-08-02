import 'react-native-gesture-handler';

// Background FCM/APNs task must register before the root component mounts.
import '@/modules/notifications/backgroundNotificationTask';

import { registerRootComponent } from 'expo';

import App from './App';

registerRootComponent(App);
