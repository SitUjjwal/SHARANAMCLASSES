/**
 * ProfileStatsRow — horizontal KPI strip (modern dashboard-style stats).
 */
import { StyleSheet, Text, View } from 'react-native';

import type { StudentProfileStats } from '@sharanam/shared';
import { useAppTheme } from '@/theme/ThemeProvider';
import { colors, spacing, typography } from '@/theme';

type Props = {
  stats: StudentProfileStats;
};

function StatCell({
  label,
  value,
  showDivider,
}: {
  label: string;
  value: string;
  showDivider?: boolean;
}) {
  const theme = useAppTheme();
  return (
    <View style={[styles.cell, showDivider ? styles.cellDivider : null]}>
      <Text style={[styles.value, { color: theme.textPrimary }]}>{value}</Text>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

export function ProfileStatsRow({ stats }: Props) {
  const theme = useAppTheme();
  const avg =
    stats.total_tests > 0 ? `${Math.round(stats.average_score)}%` : '—';
  const isDark = theme.canvas === '#0B1F3A';

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
          borderColor: theme.cardBorder,
        },
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: colors.accent }]} />
      <StatCell label="Courses" value={String(stats.purchased_courses)} />
      <StatCell label="Tests done" value={String(stats.total_tests)} showDivider />
      <StatCell label="Avg score" value={avg} showDivider />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  cellDivider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: 'rgba(168,179,197,0.35)',
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
});
