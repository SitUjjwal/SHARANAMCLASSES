/**
 * ContinueLearningCard — resume last watched chapter / video.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { LearningProgressContinue, LearningProgressLastVideo } from '@sharanam/shared';
import { colors, spacing, typography } from '@/theme';

type Props = {
  continueLearning: LearningProgressContinue | null;
  lastWatchedVideo: LearningProgressLastVideo | null;
  onContinue: () => void;
};

export function ContinueLearningCard({
  continueLearning,
  lastWatchedVideo,
  onContinue,
}: Props) {
  if (!continueLearning) {
    return (
      <View style={styles.card}>
        <Text style={styles.label}>Continue Learning</Text>
        <Text style={styles.empty}>
          Open any chapter to start tracking. Your last watched video will appear here.
        </Text>
      </View>
    );
  }

  const videoTitle =
    lastWatchedVideo?.title ??
    continueLearning.video_title ??
    continueLearning.chapter_title;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Continue Learning</Text>
      <Text style={styles.course} numberOfLines={1}>
        {continueLearning.course_title}
      </Text>
      <Text style={styles.chapter} numberOfLines={1}>
        {continueLearning.chapter_title}
      </Text>

      <View style={styles.videoBlock}>
        <Text style={styles.videoLabel}>Last Watched Video</Text>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {videoTitle}
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.cta, pressed ? styles.ctaPressed : null]}
        onPress={onContinue}
        accessibilityRole="button"
      >
        <Text style={styles.ctaText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: 'rgba(201,162,39,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(201,162,39,0.35)',
  },
  label: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  empty: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
    lineHeight: 20,
  },
  course: {
    color: colors.surface,
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
  },
  chapter: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
  },
  videoBlock: {
    marginTop: spacing.xs,
    gap: 4,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  videoLabel: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  videoTitle: {
    color: colors.surface,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  cta: {
    marginTop: spacing.sm,
    minHeight: 44,
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
