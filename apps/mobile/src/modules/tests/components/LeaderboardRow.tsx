/**
 * LeaderboardRow — rank · name · score · % · time.
 */
import { StyleSheet, Text, View } from 'react-native';

import { formatTimeTaken } from '@/modules/tests/utils/formatTimeTaken';
import { colors, spacing, typography } from '@/theme';
import type { LeaderboardEntry } from '@sharanam/shared';

type Props = {
  entry: LeaderboardEntry;
  highlight?: boolean;
};

export function LeaderboardRow({ entry, highlight }: Props) {
  const topThree = entry.rank <= 3;

  return (
    <View
      style={[styles.row, highlight ? styles.highlight : null]}
      accessibilityLabel={`Rank ${entry.rank}, ${entry.student_name}`}
    >
      <View style={[styles.rankCell, topThree ? styles.rankTop : null]}>
        <Text style={[styles.rank, topThree ? styles.rankTopText : null]}>
          #{entry.rank}
        </Text>
      </View>
      <View style={styles.nameCell}>
        <Text style={styles.name} numberOfLines={1}>
          {entry.student_name}
        </Text>
        <Text style={styles.testTitle} numberOfLines={1}>
          {entry.test_title}
        </Text>
      </View>
      <View style={styles.statCell}>
        <Text style={styles.statValue}>{entry.score}</Text>
        <Text style={styles.statLabel}>Score</Text>
      </View>
      <View style={styles.statCell}>
        <Text style={styles.statValue}>{entry.percentage}%</Text>
        <Text style={styles.statLabel}>Pct</Text>
      </View>
      <View style={styles.statCell}>
        <Text style={styles.statValue}>
          {formatTimeTaken(entry.time_taken_seconds)}
        </Text>
        <Text style={styles.statLabel}>Time</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  highlight: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(201,162,39,0.12)',
  },
  rankCell: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  rankTop: {
    backgroundColor: 'rgba(201,162,39,0.2)',
  },
  rank: {
    color: '#A8B3C5',
    fontWeight: '800',
    fontSize: typography.fontSize.md,
  },
  rankTopText: {
    color: colors.accent,
  },
  nameCell: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: typography.fontSize.md,
  },
  testTitle: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
  },
  statCell: {
    alignItems: 'flex-end',
    minWidth: 48,
  },
  statValue: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: typography.fontSize.sm,
  },
  statLabel: {
    color: '#7A8799',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
