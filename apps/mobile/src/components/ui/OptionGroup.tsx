/**
 * Option chip group — for Class / Medium selection.
 * Why: clear visible choices without a native picker (Expo-friendly).
 * Future: reuse for filters (board, subject, batch).
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';

export type OptionItem = {
  label: string;
  value: string;
};

type OptionGroupProps = {
  label: string;
  options: readonly OptionItem[];
  value?: string;
  onChange: (value: string) => void;
  error?: string;
};

export function OptionGroup({ label, options, value, onChange, error }: OptionGroupProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={[styles.chip, selected ? styles.chipSelected : null]}
            >
              <Text style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  label: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  chipSelected: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(201,162,39,0.22)',
  },
  chipLabel: {
    color: colors.surface,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  chipLabelSelected: {
    color: colors.accent,
  },
  error: {
    color: '#FF8A80',
    fontSize: typography.fontSize.sm,
  },
});
