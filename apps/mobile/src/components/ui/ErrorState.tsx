/**
 * ErrorState — section/page failure with retry.
 * Why: API errors stay local to the failing query instead of crashing the tree.
 */
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { colors, spacing, typography } from '@/theme';

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Couldn’t load</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? <AppButton label="Try again" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(198,40,40,0.35)',
    backgroundColor: 'rgba(198,40,40,0.12)',
  },
  title: {
    color: colors.surface,
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
  },
  message: {
    color: '#F5C6C6',
    fontSize: typography.fontSize.md,
    lineHeight: 20,
  },
});
