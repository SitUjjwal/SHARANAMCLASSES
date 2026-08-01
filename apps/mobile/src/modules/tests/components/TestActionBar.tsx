/**
 * TestActionBar — Previous / Next + Mark for Review + Clear Answer.
 *
 * Previous/Next move one question at a time.
 * Mark toggles is_marked_for_review for the current question.
 * Clear nulls selected_answer (keeps mark flag unless cleared separately).
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';

type Props = {
  canGoPrev: boolean;
  canGoNext: boolean;
  isMarked: boolean;
  hasAnswer: boolean;
  disabled?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToggleMark: () => void;
  onClear: () => void;
};

export function TestActionBar({
  canGoPrev,
  canGoNext,
  isMarked,
  hasAnswer,
  disabled,
  onPrev,
  onNext,
  onToggleMark,
  onClear,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <ActionChip
          label="Previous"
          disabled={disabled || !canGoPrev}
          onPress={onPrev}
        />
        <ActionChip
          label="Next"
          disabled={disabled || !canGoNext}
          onPress={onNext}
          primary
        />
      </View>
      <View style={styles.row}>
        <ActionChip
          label={isMarked ? 'Unmark review' : 'Mark for review'}
          disabled={disabled}
          onPress={onToggleMark}
          tone={isMarked ? 'warn' : 'default'}
        />
        <ActionChip
          label="Clear answer"
          disabled={disabled || !hasAnswer}
          onPress={onClear}
          tone="danger"
        />
      </View>
    </View>
  );
}

function ActionChip({
  label,
  onPress,
  disabled,
  primary,
  tone = 'default',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
  tone?: 'default' | 'warn' | 'danger';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        primary ? styles.chipPrimary : null,
        tone === 'warn' ? styles.chipWarn : null,
        tone === 'danger' ? styles.chipDanger : null,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <Text
        style={[
          styles.chipLabel,
          primary ? styles.chipLabelPrimary : null,
          tone === 'warn' ? styles.chipLabelWarn : null,
          tone === 'danger' ? styles.chipLabelDanger : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: spacing.sm,
  },
  chipPrimary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipWarn: {
    borderColor: '#E6A817',
    backgroundColor: 'rgba(230,168,23,0.15)',
  },
  chipDanger: {
    borderColor: 'rgba(198,40,40,0.5)',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.4,
  },
  chipLabel: {
    color: colors.surface,
    fontSize: typography.fontSize.md,
    fontWeight: '700',
  },
  chipLabelPrimary: {
    color: colors.primary,
  },
  chipLabelWarn: {
    color: '#F0C14A',
  },
  chipLabelDanger: {
    color: '#F28B82',
  },
});
