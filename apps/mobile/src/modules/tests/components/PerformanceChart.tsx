/**
 * PerformanceChart — simple bar chart for correct / wrong / skipped.
 * No third-party chart lib — View-based bars for Expo.
 */
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';

type Props = {
  correct: number;
  wrong: number;
  skipped: number;
};

export function PerformanceChart({ correct, wrong, skipped }: Props) {
  const total = Math.max(1, correct + wrong + skipped);
  const bars = [
    { key: 'correct', label: 'Correct', value: correct, color: colors.success },
    { key: 'wrong', label: 'Wrong', value: wrong, color: colors.danger },
    { key: 'skipped', label: 'Skipped', value: skipped, color: '#8A95A8' },
  ] as const;

  return (
    <View style={styles.wrap} accessibilityLabel="Performance chart">
      <Text style={styles.title}>Performance</Text>
      <View style={styles.chart}>
        {bars.map((bar) => {
          const heightPct = Math.max(8, Math.round((bar.value / total) * 100));
          return (
            <View key={bar.key} style={styles.col}>
              <Text style={styles.value}>{bar.value}</Text>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    {
                      height: `${heightPct}%`,
                      backgroundColor: bar.color,
                    },
                  ]}
                />
              </View>
              <Text style={styles.label}>{bar.label}</Text>
            </View>
          );
        })}
      </View>
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
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 160,
    gap: spacing.md,
  },
  col: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    height: '100%',
    justifyContent: 'flex-end',
  },
  value: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: typography.fontSize.md,
  },
  track: {
    width: '70%',
    flex: 1,
    maxHeight: 110,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  fill: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    minHeight: 4,
  },
  label: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
});
