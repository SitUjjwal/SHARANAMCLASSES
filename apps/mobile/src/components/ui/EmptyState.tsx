/**
 * EmptyState — shown when a section has zero rows from the API.
 * Why: distinguishes “no content yet” from loading/errors.
 */
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography } from '@/theme';

type EmptyStateProps = {
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function EmptyState({
  title,
  message,
  icon = 'file-tray-outline',
}: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={28} color="#7A8799" />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  title: {
    color: colors.surface,
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
    textAlign: 'center',
    lineHeight: 20,
  },
});
