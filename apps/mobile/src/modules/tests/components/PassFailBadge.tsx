/**
 * PassFailBadge — large Pass / Fail signal from is_passed.
 */
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';

type Props = {
  isPassed: boolean;
  passingMarks: number;
  obtainedMarks: number;
};

export function PassFailBadge({
  isPassed,
  passingMarks,
  obtainedMarks,
}: Props) {
  return (
    <View
      style={[styles.wrap, isPassed ? styles.pass : styles.fail]}
      accessibilityRole="text"
      accessibilityLabel={isPassed ? 'Passed' : 'Failed'}
    >
      <Text style={styles.title}>{isPassed ? 'PASS' : 'FAIL'}</Text>
      <Text style={styles.sub}>
        {obtainedMarks} / {passingMarks} required
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
  },
  pass: {
    backgroundColor: 'rgba(46,125,50,0.2)',
    borderColor: colors.success,
  },
  fail: {
    backgroundColor: 'rgba(198,40,40,0.18)',
    borderColor: colors.danger,
  },
  title: {
    color: colors.surface,
    fontSize: typography.fontSize.xxl,
    fontWeight: '800',
    letterSpacing: 2,
  },
  sub: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
  },
});
