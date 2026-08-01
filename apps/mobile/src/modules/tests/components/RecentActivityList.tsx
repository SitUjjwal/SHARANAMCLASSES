/**
 * RecentActivityList — latest scored attempts.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';
import type { AnalyticsRecentActivity } from '@sharanam/shared';

type Props = {
  items: AnalyticsRecentActivity[];
  onOpenResult?: (attemptId: string) => void;
};

export function RecentActivityList({ items, onOpenResult }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Recent activity</Text>
      {items.length === 0 ? (
        <Text style={styles.empty}>No completed tests yet.</Text>
      ) : (
        items.map((item) => (
          <Pressable
            key={item.attempt_id}
            disabled={!onOpenResult}
            onPress={() => onOpenResult?.(item.attempt_id)}
            style={styles.row}
          >
            <View style={styles.meta}>
              <Text style={styles.testTitle} numberOfLines={1}>
                {item.test_title}
              </Text>
              <Text style={styles.sub}>
                {item.subject} · {item.submitted_at.slice(0, 10)}
              </Text>
            </View>
            <View style={styles.right}>
              <Text
                style={[
                  styles.pct,
                  item.is_passed ? styles.pass : styles.fail,
                ]}
              >
                {item.percentage}%
              </Text>
              <Text style={styles.badge}>
                {item.is_passed ? 'Pass' : 'Fail'}
              </Text>
            </View>
          </Pressable>
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
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  meta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  testTitle: {
    color: colors.surface,
    fontWeight: '600',
    fontSize: typography.fontSize.md,
  },
  sub: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
  },
  right: {
    alignItems: 'flex-end',
    gap: 2,
  },
  pct: {
    fontWeight: '800',
    fontSize: typography.fontSize.md,
  },
  pass: { color: colors.success },
  fail: { color: colors.danger },
  badge: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
});
