/**
 * SubjectBarsChart — horizontal bars by subject average %.
 */
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';
import type { AnalyticsSubjectStat } from '@sharanam/shared';

type Props = {
  items: AnalyticsSubjectStat[];
};

export function SubjectBarsChart({ items }: Props) {
  return (
    <View style={styles.wrap} accessibilityLabel="Subject performance chart">
      <Text style={styles.title}>By subject</Text>
      {items.length === 0 ? (
        <Text style={styles.empty}>No subject data yet.</Text>
      ) : (
        items.map((item) => (
          <View key={item.subject} style={styles.row}>
            <Text style={styles.label} numberOfLines={1}>
              {item.subject}
            </Text>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${Math.min(100, Math.max(4, item.average_percentage))}%` },
                ]}
              />
            </View>
            <Text style={styles.pct}>{item.average_percentage}%</Text>
          </View>
        ))
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    width: 72,
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  track: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: colors.secondary,
  },
  pct: {
    width: 48,
    textAlign: 'right',
    color: colors.surface,
    fontWeight: '700',
    fontSize: typography.fontSize.sm,
  },
});
