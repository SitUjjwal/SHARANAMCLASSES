/**
 * App root providers.
 * Order: AuthProvider wraps navigation so redirects see auth state.
 * Brand splash is controlled inside RootNavigator (min 3s full-screen photo).
 */
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/api/queryClient';
import { AuthProvider } from '@/auth/AuthProvider';
import { RootNavigator } from '@/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RootNavigator />
            <StatusBar style="light" />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A3D2E',
  },
});
