/**
 * SectionHeader — title + optional action for dashboard blocks.
 * Why: consistent section rhythm across Home (one job per section).
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function SectionHeader({ title, actionLabel, onActionPress }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onActionPress ? (
        <Pressable onPress={onActionPress} accessibilityRole="button">
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.surface,
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
  },
  action: {
    color: colors.accent,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
});
