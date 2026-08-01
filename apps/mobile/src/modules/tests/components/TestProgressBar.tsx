/**
 * TestProgressBar — answered / total questions as a fill bar + label.
 *
 * Progress = how many questions have a selected option (not mark-for-review alone).
 */
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';

type Props = {
  answered: number;
  total: number;
};

export function TestProgressBar({ answered, total }: Props) {
  const safeTotal = Math.max(1, total);
  const percent = Math.min(100, Math.round((answered / safeTotal) * 100));

  return (
    <View style={styles.wrap} accessibilityRole="progressbar">
      <View style={styles.row}>
        <Text style={styles.label}>Progress</Text>
        <Text style={styles.value}>
          {answered}/{total} · {percent}%
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  value: {
    color: colors.surface,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
});
