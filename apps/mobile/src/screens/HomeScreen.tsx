/**
 * Home Screen — shown after successful login (protected).
 * Includes logout that clears Supabase + Zustand and returns to Login.
 */
import { StyleSheet, Text, View } from 'react-native';

import { AppButton, ErrorMessage, LoadingOverlay, Screen } from '@/components/ui';
import { APP_NAME } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useLogoutMutation } from '@/hooks/useAuthMutations';
import { colors, spacing, typography } from '@/theme';

export function HomeScreen() {
  const { user } = useAuth();
  const logoutMutation = useLogoutMutation();

  /**
   * onLogout
   * 1) Clears Supabase session (SecureStore)
   * 2) Clears Zustand auth store
   * 3) Clears React Query cache
   * 4) RootNavigator auto-navigates to Login (status → unauthenticated)
   */
  function onLogout() {
    logoutMutation.mutate();
  }

  const displayName =
    (user?.user_metadata?.full_name as string | undefined)?.trim() ||
    user?.email ||
    'Student';

  return (
    <Screen style={styles.container}>
      <LoadingOverlay visible={logoutMutation.isPending} message="Signing you out…" />

      <Text style={styles.brand}>{APP_NAME}</Text>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.subtitle}>Welcome, {displayName}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>You are signed in</Text>
        <Text style={styles.cardBody}>
          Session is saved securely on this device. Course content will appear here in the next
          modules.
        </Text>

        <ErrorMessage message={logoutMutation.error?.message} />

        <AppButton
          label="Log out"
          loading={logoutMutation.isPending}
          onPress={onLogout}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  brand: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: spacing.sm,
    color: colors.surface,
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    color: '#A8B3C5',
    fontSize: typography.fontSize.lg,
  },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTitle: {
    color: colors.surface,
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
  },
  cardBody: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
    lineHeight: 20,
  },
});
