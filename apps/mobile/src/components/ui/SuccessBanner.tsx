/**
 * Success banner shown after registration completes.
 */
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography } from '@/theme';

type SuccessBannerProps = {
  title: string;
  message: string;
};

export function SuccessBanner({ title, message }: SuccessBannerProps) {
  return (
    <View style={styles.card} accessibilityRole="summary">
      <Ionicons name="checkmark-circle" size={28} color="#7DDEA5" />
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: 'rgba(125,222,165,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(125,222,165,0.35)',
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: '#7DDEA5',
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
  },
  message: {
    color: colors.surface,
    fontSize: typography.fontSize.md,
    lineHeight: 20,
  },
});
