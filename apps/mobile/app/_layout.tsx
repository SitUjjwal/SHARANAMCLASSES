import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

/**
 * Root layout — navigation shell only.
 * Feature screens live under app/(auth) and app/(tabs).
 */
export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
