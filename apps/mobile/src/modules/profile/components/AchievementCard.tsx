/**
 * AchievementCard — locked/unlocked achievement tile.
 */
import { StyleSheet, Text, View } from 'react-native';

import type { Achievement } from '@sharanam/shared';
import { colors, spacing, typography } from '@/theme';

type Props = {
  achievement: Achievement;
};

export function AchievementCard({ achievement }: Props) {
  return (
    <View style={[styles.card, !achievement.unlocked && styles.locked]}>
      <Text style={styles.icon}>{achievement.unlocked ? '★' : '☆'}</Text>
      <View style={styles.body}>
        <Text style={styles.title}>{achievement.title}</Text>
        <Text style={styles.desc}>{achievement.description}</Text>
        <Text style={styles.status}>
          {achievement.unlocked
            ? `Unlocked ${new Date(achievement.unlocked_at ?? '').toLocaleDateString('en-IN')}`
            : 'Locked'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(201,162,39,0.4)',
  },
  locked: {
    opacity: 0.55,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  icon: {
    color: colors.accent,
    fontSize: 28,
    lineHeight: 32,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: typography.fontSize.md,
  },
  desc: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
  },
  status: {
    marginTop: spacing.xs,
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
});
