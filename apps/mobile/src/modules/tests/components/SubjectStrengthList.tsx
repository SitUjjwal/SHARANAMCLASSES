/**
 * SubjectStrengthList — Strong / Weak subjects with avg %.
 */
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';
import type { AnalyticsSubjectStat } from '@sharanam/shared';

type Props = {
  title: string;
  items: AnalyticsSubjectStat[];
  tone: 'strong' | 'weak';
};

export function SubjectStrengthList({ title, items, tone }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {items.length === 0 ? (
        <Text style={styles.empty}>Not enough data yet.</Text>
      ) : (
        items.map((item) => (
          <View key={item.subject} style={styles.row}>
            <View style={styles.meta}>
              <Text style={styles.subject}>{item.subject}</Text>
              <Text style={styles.sub}>
                {item.attempts} attempts · {item.pass_percent}% pass
              </Text>
            </View>
            <Text
              style={[
                styles.pct,
                tone === 'strong' ? styles.strong : styles.weak,
              ]}
            >
              {item.average_percentage}%
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
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
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  meta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  subject: {
    color: colors.surface,
    fontWeight: '600',
    fontSize: typography.fontSize.md,
  },
  sub: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
  },
  pct: {
    fontWeight: '800',
    fontSize: typography.fontSize.lg,
  },
  strong: {
    color: colors.success,
  },
  weak: {
    color: colors.danger,
  },
});
