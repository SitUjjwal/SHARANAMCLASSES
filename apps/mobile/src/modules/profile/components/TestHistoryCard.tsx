/**
 * TestHistoryCard — Test Name · Date · Score · % · Rank · View Result.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TestAttemptResultSummary } from '@sharanam/shared';
import { colors, spacing, typography } from '@/theme';

type Props = {
  item: TestAttemptResultSummary;
  onViewResult: () => void;
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function TestHistoryCard({ item, onViewResult }: Props) {
  const scoreLabel = `${item.obtained_marks}/${item.total_marks}`;
  const pctLabel = `${Number(item.percentage).toFixed(item.percentage % 1 ? 1 : 0)}%`;
  const rankLabel = item.rank != null ? `#${item.rank}` : '—';

  return (
    <View style={styles.card}>
      <Text style={styles.name} numberOfLines={2}>
        {item.test_title}
      </Text>

      <View style={styles.grid}>
        <View style={styles.cell}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>{formatDate(item.submitted_at)}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.label}>Score</Text>
          <Text style={styles.value}>{scoreLabel}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.label}>Percentage</Text>
          <Text style={[styles.value, styles.accent]}>{pctLabel}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.label}>Rank</Text>
          <Text style={styles.value}>{rankLabel}</Text>
        </View>
      </View>

      <Text style={styles.pass}>
        {item.is_passed ? 'Passed' : 'Not passed'}
      </Text>

      <Pressable
        style={({ pressed }) => [styles.cta, pressed ? styles.ctaPressed : null]}
        onPress={onViewResult}
        accessibilityRole="button"
        accessibilityLabel="View result"
      >
        <Text style={styles.ctaText}>View Result</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  name: {
    color: colors.surface,
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cell: {
    width: '47%',
    gap: 2,
  },
  label: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  value: {
    color: colors.surface,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  accent: {
    color: colors.accent,
  },
  pass: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
  },
  cta: {
    marginTop: spacing.xs,
    minHeight: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  ctaPressed: {
    opacity: 0.9,
  },
  ctaText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: typography.fontSize.md,
  },
});
