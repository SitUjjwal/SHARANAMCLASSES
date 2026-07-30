/**
 * Inline error banner for mutation failures.
 */
import { StyleSheet, Text } from 'react-native';

import { spacing, typography } from '@/theme';

type ErrorMessageProps = {
  message?: string | null;
};

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) {
    return null;
  }

  return <Text style={styles.text}>{message}</Text>;
}

const styles = StyleSheet.create({
  text: {
    color: '#FF8A80',
    fontSize: typography.fontSize.md,
    marginBottom: spacing.sm,
  },
});
