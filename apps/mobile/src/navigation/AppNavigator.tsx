/**
 * Authenticated stack (protected).
 * Why: only mounted when a Supabase session exists.
 * After login, user lands on Home.
 */
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from '@/screens/HomeScreen';
import type { AppStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
}
