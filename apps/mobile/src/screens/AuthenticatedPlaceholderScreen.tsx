/**
 * Temporary authenticated landing (NOT the Home feature screen).
 * Why: prove protected navigation + logout before Home module is built.
 */
import { StyleSheet, Text, View } from 'react-native';

import { AppButton, ErrorMessage, Screen } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useLogoutMutation } from '@/hooks/useAuthMutations';
import { colors, spacing, typography } from '@/theme';

export function AuthenticatedPlaceholderScreen() {
  const { user } = useAuth();
  const logoutMutation = useLogoutMutation();

  return (
    <Screen style={styles.container}>
      <Text style={styles.title}>Signed in</Text>
      <Text style={styles.subtitle}>{user?.email ?? 'Authenticated session'}</Text>
      <Text style={styles.hint}>Home screen will be built in a later module.</Text>

      <View style={styles.actions}>
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
  container: {
    justifyContent: 'center',
  },
  title: {
    color: colors.surface,
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: spacing.sm,
    color: '#A8B3C5',
    fontSize: typography.fontSize.lg,
  },
  hint: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    color: '#7A8799',
    fontSize: typography.fontSize.md,
  },
  actions: {
    gap: spacing.md,
  },
});
