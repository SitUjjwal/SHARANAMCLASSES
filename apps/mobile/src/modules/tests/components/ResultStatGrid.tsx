/**
 * ResultStatGrid — Total / Obtained / Correct / Wrong / Skipped / Percentage.
 */
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';
import type { TestAttemptResultSummary } from '@sharanam/shared';

type Props = {
  summary: TestAttemptResultSummary;
};

export function ResultStatGrid({ summary }: Props) {
  const cells = [
    { label: 'Total marks', value: String(summary.total_marks) },
    { label: 'Obtained', value: String(summary.obtained_marks) },
    { label: 'Correct', value: String(summary.correct_count) },
    { label: 'Wrong', value: String(summary.wrong_count) },
    { label: 'Skipped', value: String(summary.skipped_count) },
    { label: 'Percentage', value: `${summary.percentage}%` },
  ];

  return (
    <View style={styles.grid}>
      {cells.map((cell) => (
        <View key={cell.label} style={styles.cell}>
          <Text style={styles.value}>{cell.value}</Text>
          <Text style={styles.label}>{cell.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cell: {
    width: '31%',
    flexGrow: 1,
    minWidth: 96,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    gap: spacing.xs,
  },
  value: {
    color: colors.surface,
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
  },
  label: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
});
