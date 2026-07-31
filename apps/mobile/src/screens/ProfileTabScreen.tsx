/**
 * Profile tab — account summary + logout.
 * Why: keeps account actions off the Home dashboard scroll.
 */
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Screen } from '@/components/ui/Screen';
import { APP_NAME } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useLogoutMutation } from '@/hooks/useAuthMutations';
import { colors, spacing, typography } from '@/theme';

export function ProfileTabScreen() {
  const { user } = useAuth();
  const logoutMutation = useLogoutMutation();

  const displayName =
    (user?.user_metadata?.full_name as string | undefined)?.trim() ||
    user?.email ||
    'Student';

  return (
    <Screen style={styles.screen}>
      <LoadingOverlay visible={logoutMutation.isPending} message="Signing you out…" />

      <Text style={styles.brand}>{APP_NAME}</Text>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>{displayName}</Text>
      {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}

      <View style={styles.card}>
        <ErrorMessage message={logoutMutation.error?.message} />
        <AppButton
          label="Log out"
          loading={logoutMutation.isPending}
          onPress={() => logoutMutation.mutate()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'center',
  },
  brand: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  title: {
    marginTop: spacing.sm,
    color: colors.surface,
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: spacing.sm,
    color: colors.surface,
    fontSize: typography.fontSize.lg,
    textAlign: 'center',
    fontWeight: '600',
  },
  email: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    color: '#A8B3C5',
    textAlign: 'center',
  },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
});
