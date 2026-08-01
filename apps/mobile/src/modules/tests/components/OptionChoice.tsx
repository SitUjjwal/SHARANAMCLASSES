/**
 * OptionChoice — one of four MCQ options (A–D).
 *
 * Selected state uses accent border/fill; disabled when time is up.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';
import type { QuestionCorrectAnswer } from '@sharanam/shared';

type Props = {
  optionKey: QuestionCorrectAnswer;
  label: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: (key: QuestionCorrectAnswer) => void;
};

export function OptionChoice({
  optionKey,
  label,
  selected,
  disabled,
  onSelect,
}: Props) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={() => onSelect(optionKey)}
      style={({ pressed }) => [
        styles.row,
        selected ? styles.selected : null,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <View style={[styles.badge, selected ? styles.badgeSelected : null]}>
        <Text style={[styles.badgeText, selected ? styles.badgeTextSelected : null]}>
          {optionKey}
        </Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  selected: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(201,162,39,0.12)',
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.55,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  badgeSelected: {
    backgroundColor: colors.accent,
  },
  badgeText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: typography.fontSize.sm,
  },
  badgeTextSelected: {
    color: colors.primary,
  },
  label: {
    flex: 1,
    color: colors.surface,
    fontSize: typography.fontSize.md,
    lineHeight: 22,
  },
});
