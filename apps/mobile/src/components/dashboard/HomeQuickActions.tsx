/**
 * HomeQuickActions — direct entry to Test Series for every student.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography } from '@/theme';

type HomeQuickActionsProps = {
  onPressTests: () => void;
  onPressLive?: () => void;
};

export function HomeQuickActions({ onPressTests, onPressLive }: HomeQuickActionsProps) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open Test Series"
        onPress={onPressTests}
        style={({ pressed }) => [styles.primary, pressed ? styles.pressed : null]}
      >
        <View style={styles.iconWrap}>
          <Ionicons name="document-text" size={22} color={colors.primary} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.primaryTitle}>Test Series</Text>
          <Text style={styles.primarySub}>Practice · Mock · Daily quiz</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
      </Pressable>

      {onPressLive ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open Live classes"
          onPress={onPressLive}
          style={({ pressed }) => [styles.secondary, pressed ? styles.pressed : null]}
        >
          <Ionicons name="radio-outline" size={20} color={colors.accent} />
          <Text style={styles.secondaryLabel}>Live</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'stretch',
  },
  primary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.accent,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,31,58,0.12)',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  primaryTitle: {
    color: colors.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
  },
  primarySub: {
    color: 'rgba(11,31,58,0.7)',
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  secondary: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  secondaryLabel: {
    color: colors.surface,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.88,
  },
});
