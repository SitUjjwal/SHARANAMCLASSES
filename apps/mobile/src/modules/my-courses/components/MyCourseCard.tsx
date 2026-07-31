/**
 * MyCourseCard — simple list row matching:
 *
 *   📘 Mathematics
 *   45%
 *   Continue
 *   --------------------
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MyCourseItem } from '@sharanam/shared';

import { ProgressBar } from '@/modules/my-courses/components/ProgressBar';
import { bookIconForTitle } from '@/modules/my-courses/utils/bookIcon';
import { colors, spacing, typography } from '@/theme';

type Props = {
  item: MyCourseItem;
  onOpenCourse: (item: MyCourseItem) => void;
  onContinue: (item: MyCourseItem) => void;
};

export function MyCourseCard({ item, onOpenCourse, onContinue }: Props) {
  const percent = Math.min(100, Math.max(0, Math.round(item.progress_percent)));
  const icon = bookIconForTitle(item.title);

  return (
    <View style={styles.row}>
      <Pressable
        style={styles.main}
        onPress={() => onOpenCourse(item)}
        accessibilityRole="button"
        accessibilityLabel={item.title}
      >
        <Text style={styles.emoji} accessibilityLabel="Course">
          {icon}
        </Text>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>

          <Text style={styles.percent}>{percent}%</Text>

          <ProgressBar percent={percent} />

          {item.last_watched_chapter_title ? (
            <Text style={styles.lastWatched} numberOfLines={1}>
              Last: {item.last_watched_chapter_title}
            </Text>
          ) : null}
        </View>
      </Pressable>

      <Pressable
        style={styles.continueBtn}
        onPress={() => onContinue(item)}
        accessibilityRole="button"
        accessibilityLabel="Continue"
      >
        <Text style={styles.continueText}>Continue</Text>
      </Pressable>

      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.md,
  },
  main: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  emoji: {
    fontSize: 32,
    lineHeight: 40,
    width: 40,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.surface,
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
    lineHeight: 26,
  },
  percent: {
    color: colors.accent,
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
  },
  lastWatched: {
    color: '#7A8799',
    fontSize: typography.fontSize.sm,
  },
  continueBtn: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.accent,
  },
  continueText: {
    color: colors.primary,
    fontSize: typography.fontSize.md,
    fontWeight: '800',
  },
  divider: {
    marginTop: spacing.md,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
});
