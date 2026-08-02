/**
 * LearningProgressSummaryCard — completed / remaining / overall % + bar.
 */
import { StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/modules/profile/components/ProgressBar';
import { colors, spacing, typography } from '@/theme';

type Props = {
  completedChapters: number;
  remainingChapters: number;
  overallPercentage: number;
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function LearningProgressSummaryCard({
  completedChapters,
  remainingChapters,
  overallPercentage,
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Overall Course Percentage</Text>
      <Text style={styles.bigPct}>{overallPercentage}%</Text>
      <ProgressBar percent={overallPercentage} height={12} />

      <View style={styles.row}>
        <Stat label="Completed Chapters" value={String(completedChapters)} />
        <View style={styles.divider} />
        <Stat label="Remaining Chapters" value={String(remainingChapters)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heading: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bigPct: {
    color: colors.surface,
    fontSize: 40,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  statValue: {
    color: colors.accent,
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
  },
  statLabel: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    fontWeight: '600',
  },
});
