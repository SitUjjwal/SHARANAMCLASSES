/**
 * ProfileStatsRow — stacked stats with horizontal rules (wireframe layout).
 *
 * Purchased Courses / Tests Completed / Average Score
 */
import { StyleSheet, Text, View } from 'react-native';

import type { StudentProfileStats } from '@sharanam/shared';
import { colors, spacing, typography } from '@/theme';

type Props = {
  stats: StudentProfileStats;
};

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.block}>
      <View style={styles.rule} />
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function ProfileStatsRow({ stats }: Props) {
  const avg =
    stats.total_tests > 0
      ? `${Math.round(stats.average_score)}%`
      : '—';

  return (
    <View style={styles.wrap}>
      <StatBlock label="Purchased Courses" value={String(stats.purchased_courses)} />
      <StatBlock label="Tests Completed" value={String(stats.total_tests)} />
      <StatBlock label="Average Score" value={avg} />
      <View style={styles.rule} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  block: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  rule: {
    alignSelf: 'stretch',
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  label: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  value: {
    color: colors.surface,
    fontSize: typography.fontSize.xxl,
    fontWeight: '800',
    textAlign: 'center',
  },
});
