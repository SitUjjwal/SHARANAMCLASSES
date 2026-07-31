/**
 * CourseListFilters — price / featured / medium chips (server-side filters).
 */
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors, spacing, typography } from '@/theme';

export type PriceFilter = 'all' | 'free' | 'paid';

export type CourseListFilterValues = {
  price: PriceFilter;
  featured: boolean;
  medium?: 'hindi' | 'english';
};

export type CourseListFiltersProps = {
  value: CourseListFilterValues;
  onChange: (next: CourseListFilterValues) => void;
};

type Chip = {
  key: string;
  label: string;
  active: boolean;
  onPress: () => void;
};

export function CourseListFilters({ value, onChange }: CourseListFiltersProps) {
  const chips: Chip[] = [
    {
      key: 'all',
      label: 'All',
      active: value.price === 'all' && !value.featured && !value.medium,
      onPress: () => onChange({ price: 'all', featured: false, medium: undefined }),
    },
    {
      key: 'free',
      label: 'Free',
      active: value.price === 'free',
      onPress: () => onChange({ ...value, price: value.price === 'free' ? 'all' : 'free' }),
    },
    {
      key: 'paid',
      label: 'Paid',
      active: value.price === 'paid',
      onPress: () => onChange({ ...value, price: value.price === 'paid' ? 'all' : 'paid' }),
    },
    {
      key: 'featured',
      label: 'Featured',
      active: value.featured,
      onPress: () => onChange({ ...value, featured: !value.featured }),
    },
    {
      key: 'hindi',
      label: 'Hindi',
      active: value.medium === 'hindi',
      onPress: () =>
        onChange({
          ...value,
          medium: value.medium === 'hindi' ? undefined : 'hindi',
        }),
    },
    {
      key: 'english',
      label: 'English',
      active: value.medium === 'english',
      onPress: () =>
        onChange({
          ...value,
          medium: value.medium === 'english' ? undefined : 'english',
        }),
    },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {chips.map((chip) => (
        <Pressable
          key={chip.key}
          onPress={chip.onPress}
          style={[styles.chip, chip.active && styles.chipActive]}
          accessibilityRole="button"
          accessibilityState={{ selected: chip.active }}
        >
          <Text style={[styles.label, chip.active && styles.labelActive]}>{chip.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(201,162,39,0.18)',
  },
  label: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  labelActive: {
    color: colors.accent,
  },
});
