/**
 * ProgressCard — per-course progress with chapter counts + bar.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { LearningProgressCourse } from '@sharanam/shared';
import { ProgressBar } from '@/modules/profile/components/ProgressBar';
import { colors, spacing, typography } from '@/theme';

type Props = {
  course: LearningProgressCourse;
  onPress?: () => void;
  onContinue?: () => void;
};

export function ProgressCard({ course, onPress, onContinue }: Props) {
  const pct = Math.min(100, Math.max(0, course.progress_percent));
  const canContinue = Boolean(course.last_watched_chapter_id && onContinue);

  return (
    <Pressable style={styles.card} onPress={onPress} disabled={!onPress}>
      <View style={styles.row}>
        <Text style={styles.title} numberOfLines={2}>
          {course.title}
        </Text>
        <Text style={styles.pct}>{pct}%</Text>
      </View>

      <ProgressBar percent={pct} />

      <Text style={styles.meta}>
        {course.completed_chapters} completed · {course.remaining_chapters} remaining
        {course.total_chapters > 0 ? ` · ${course.total_chapters} chapters` : ''}
      </Text>

      {course.last_watched_video_title || course.last_watched_chapter_title ? (
        <Text style={styles.last} numberOfLines={1}>
          Last:{' '}
          {course.last_watched_video_title ?? course.last_watched_chapter_title}
        </Text>
      ) : null}

      {canContinue ? (
        <Pressable
          style={styles.continueBtn}
          onPress={() => onContinue?.()}
          accessibilityRole="button"
        >
          <Text style={styles.continueText}>Continue Learning</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    alignItems: 'center',
  },
  title: {
    flex: 1,
    color: colors.surface,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  pct: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: typography.fontSize.md,
  },
  meta: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
  },
  last: {
    color: '#C5D0E0',
    fontSize: typography.fontSize.sm,
  },
  continueBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    backgroundColor: 'rgba(201,162,39,0.18)',
  },
  continueText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: typography.fontSize.sm,
  },
});
