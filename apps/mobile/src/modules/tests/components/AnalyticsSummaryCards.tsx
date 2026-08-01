/**
 * AnalyticsSummaryCards — Average Score · Total Tests · Pass %
 */
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';
import type { StudentTestAnalytics } from '@sharanam/shared';

type Props = {
  summary: StudentTestAnalytics['summary'];
};

export function AnalyticsSummaryCards({ summary }: Props) {
  const cards = [
    {
      label: 'Average score',
      value: `${summary.average_score}%`,
    },
    {
      label: 'Total tests',
      value: String(summary.total_tests),
      hint: `${summary.total_attempts} attempts`,
    },
    {
      label: 'Pass percentage',
      value: `${summary.pass_percentage}%`,
    },
  ];

  return (
    <View style={styles.row}>
      {cards.map((card) => (
        <View key={card.label} style={styles.card}>
          <Text style={styles.value}>{card.value}</Text>
          <Text style={styles.label}>{card.label}</Text>
          {card.hint ? <Text style={styles.hint}>{card.hint}</Text> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    flexGrow: 1,
    minWidth: 100,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: spacing.xs,
  },
  value: {
    color: colors.accent,
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
  },
  label: {
    color: colors.surface,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  hint: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
  },
});
