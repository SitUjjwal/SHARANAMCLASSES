/**
 * Timer — reusable countdown chip.
 *
 * Features: countdown display, pause in background, low-time warning style,
 * auto-submit callback at zero. Logic lives in useCountdownTimer.
 */
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  useCountdownTimer,
  type UseCountdownTimerOptions,
} from './useCountdownTimer';
import { colors, spacing, typography } from '@/theme';

export type TimerProps = UseCountdownTimerOptions & {
  /** Show "Paused" badge while backgrounded. Default true. */
  showPausedBadge?: boolean;
};

export function Timer({
  showPausedBadge = true,
  ...options
}: TimerProps) {
  const {
    formatted,
    isWarning,
    isExpired,
    isPaused,
  } = useCountdownTimer(options);

  return (
    <View
      style={[
        styles.wrap,
        isWarning || isExpired ? styles.urgent : null,
        isPaused ? styles.paused : null,
      ]}
      accessibilityRole="timer"
      accessibilityLabel={
        isPaused ? `Timer paused ${formatted}` : `Time remaining ${formatted}`
      }
    >
      <Ionicons
        name={isPaused ? 'pause-circle-outline' : 'time-outline'}
        size={16}
        color={isWarning || isExpired ? colors.danger : colors.accent}
      />
      <Text
        style={[
          styles.text,
          isWarning || isExpired ? styles.urgentText : null,
        ]}
      >
        {formatted}
      </Text>
      {showPausedBadge && isPaused ? (
        <Text style={styles.pausedLabel}>Paused</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    backgroundColor: 'rgba(201,162,39,0.12)',
  },
  urgent: {
    backgroundColor: 'rgba(198,40,40,0.15)',
  },
  paused: {
    opacity: 0.85,
  },
  text: {
    color: colors.accent,
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  urgentText: {
    color: colors.danger,
  },
  pausedLabel: {
    marginLeft: 2,
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
});
