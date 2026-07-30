import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_NAME } from '@/constants';
import { env } from '@/constants/env';
import { getHealth } from '@/services/health.service';
import { colors, spacing, typography } from '@/theme';

type ConnectionState = 'loading' | 'success' | 'error';

export function HomeScreen() {
  const [state, setState] = useState<ConnectionState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const checkBackend = useCallback(async () => {
    setState('loading');
    setErrorMessage(null);

    try {
      const health = await getHealth();

      if (health.status === 'ok') {
        setState('success');
        return;
      }

      setState('error');
      setErrorMessage('Unexpected health response from backend');
    } catch (error) {
      setState('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to reach backend',
      );
    }
  }, []);

  useEffect(() => {
    void checkBackend();
  }, [checkBackend]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.brand}>{APP_NAME}</Text>
        <Text style={styles.subtitle}>Home</Text>

        <View style={styles.statusCard}>
          {state === 'loading' ? (
            <>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={styles.statusText}>Connecting to backend…</Text>
            </>
          ) : null}

          {state === 'success' ? (
            <Text style={[styles.statusText, styles.successText]}>Backend Connected</Text>
          ) : null}

          {state === 'error' ? (
            <>
              <Text style={[styles.statusText, styles.errorText]}>Backend Unavailable</Text>
              {errorMessage ? <Text style={styles.errorDetail}>{errorMessage}</Text> : null}
              <Text style={styles.hint}>API: {env.apiBaseUrl}</Text>
              <Pressable style={styles.retryButton} onPress={() => void checkBackend()}>
                <Text style={styles.retryLabel}>Retry</Text>
              </Pressable>
            </>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  brand: {
    color: colors.surface,
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: spacing.sm,
    color: '#A8B3C5',
    fontSize: typography.fontSize.lg,
    textAlign: 'center',
  },
  statusCard: {
    marginTop: spacing.xl,
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  statusText: {
    color: colors.surface,
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    textAlign: 'center',
  },
  successText: {
    color: '#7DDEA5',
  },
  errorText: {
    color: '#FF8A80',
  },
  errorDetail: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
    textAlign: 'center',
  },
  hint: {
    color: '#7A8799',
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.accent,
  },
  retryLabel: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: typography.fontSize.md,
  },
});
