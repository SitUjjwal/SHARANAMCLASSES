/**
 * ScoreTrendChart — score-over-time bars (View-based, no chart lib).
 */
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';
import type { AnalyticsCharts } from '@sharanam/shared';

type Props = {
  series: AnalyticsCharts['score_over_time'];
};

export function ScoreTrendChart({ series }: Props) {
  const max = Math.max(1, ...series.map((p) => p.average_percentage));

  return (
    <View style={styles.wrap} accessibilityLabel="Score over time chart">
      <Text style={styles.title}>Score over time</Text>
      {series.length === 0 ? (
        <Text style={styles.empty}>Complete tests to see your trend.</Text>
      ) : (
        <View style={styles.chart}>
          {series.map((point) => {
            const heightPct = Math.max(
              8,
              Math.round((point.average_percentage / max) * 100),
            );
            return (
              <View key={point.date} style={styles.col}>
                <Text style={styles.value}>{Math.round(point.average_percentage)}</Text>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      { height: `${heightPct}%` },
                    ]}
                  />
                </View>
                <Text style={styles.label}>{point.date.slice(5)}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  title: {
    color: colors.surface,
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
  },
  empty: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    minHeight: 140,
  },
  col: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    height: 140,
    justifyContent: 'flex-end',
  },
  value: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: '700',
  },
  track: {
    width: '70%',
    flex: 1,
    maxHeight: 100,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  fill: {
    width: '100%',
    backgroundColor: colors.accent,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minHeight: 4,
  },
  label: {
    color: '#A8B3C5',
    fontSize: 9,
    fontWeight: '600',
  },
});
