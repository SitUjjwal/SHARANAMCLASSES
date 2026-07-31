/**
 * BuyCourseSummary — Course Name, Teacher, Price, Discount, Final Amount.
 */
import { StyleSheet, Text, View } from 'react-native';

import { formatCoursePrice } from '@/modules/courses/utils/formatCoursePrice';
import { colors, spacing, typography } from '@/theme';
import type { BuyCoursePricing } from '../utils/coursePricing';

type Props = {
  courseName: string;
  teacherName: string;
  pricing: BuyCoursePricing;
};

export function BuyCourseSummary({ courseName, teacherName, pricing }: Props) {
  const hasDiscount = pricing.discount > 0;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Course Name</Text>
      <Text style={styles.courseName}>{courseName}</Text>

      <Text style={[styles.label, styles.gap]}>Teacher</Text>
      <Text style={styles.value}>{teacherName}</Text>

      <View style={styles.divider} />

      <Row
        label="Price"
        value={formatCoursePrice(pricing.listPrice)}
        muted={hasDiscount}
        strike={hasDiscount}
      />
      <Row
        label={
          pricing.discountPercent > 0
            ? `Discount (${pricing.discountPercent}% off)`
            : 'Discount'
        }
        value={
          hasDiscount ? `− ${formatCoursePrice(pricing.discount)}` : formatCoursePrice(0)
        }
        accent={hasDiscount}
      />
      <Row
        label="Final Amount"
        value={formatCoursePrice(pricing.finalAmount)}
        emphasize
      />
    </View>
  );
}

function Row({
  label,
  value,
  muted,
  strike,
  accent,
  emphasize,
}: {
  label: string;
  value: string;
  muted?: boolean;
  strike?: boolean;
  accent?: boolean;
  emphasize?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text
        style={[
          styles.rowValue,
          muted ? styles.muted : null,
          strike ? styles.strike : null,
          accent ? styles.discount : null,
          emphasize ? styles.final : null,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: spacing.lg,
    gap: spacing.xs,
  },
  label: {
    color: '#7A8799',
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  gap: {
    marginTop: spacing.md,
  },
  courseName: {
    color: colors.surface,
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
  },
  value: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  rowLabel: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  rowValue: {
    color: colors.surface,
    fontSize: typography.fontSize.md,
    fontWeight: '700',
  },
  muted: {
    color: '#7A8799',
  },
  strike: {
    textDecorationLine: 'line-through',
  },
  discount: {
    color: '#81C784',
  },
  final: {
    color: colors.accent,
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
  },
});
