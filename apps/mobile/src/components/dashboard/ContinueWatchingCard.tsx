/**
 * ContinueWatchingCard — Home CTA to resume last in-progress video.
 */
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ContinueWatchingItem } from '@sharanam/shared';
import { ProgressBar } from '@/modules/profile/components/ProgressBar';
import { formatVideoDuration } from '@/modules/videos/utils/formatVideoDuration';
import { colors, spacing, typography } from '@/theme';

type Props = {
  item: ContinueWatchingItem;
  onContinue: () => void;
};

export function ContinueWatchingCard({ item, onContinue }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>Continue Watching</Text>
      <View style={styles.row}>
        {item.thumbnail_url ? (
          <Image source={{ uri: item.thumbnail_url }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback]} />
        )}
        <View style={styles.meta}>
          <Text style={styles.title} numberOfLines={2}>
            {item.video_title}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {item.course_title} · {item.chapter_title}
          </Text>
          <Text style={styles.time}>
            Resume at {formatVideoDuration(Math.floor(item.position_seconds))}
            {item.duration_seconds > 0
              ? ` / ${formatVideoDuration(Math.floor(item.duration_seconds))}`
              : ''}
          </Text>
          <ProgressBar percent={item.progress_percent} height={6} />
        </View>
      </View>
      <Pressable
        style={({ pressed }) => [styles.cta, pressed ? styles.ctaPressed : null]}
        onPress={onContinue}
        accessibilityRole="button"
        accessibilityLabel="Continue watching"
      >
        <Text style={styles.ctaText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: 'rgba(201,162,39,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(201,162,39,0.4)',
  },
  kicker: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  thumb: {
    width: 96,
    height: 64,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  thumbFallback: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  meta: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.surface,
    fontSize: typography.fontSize.md,
    fontWeight: '700',
  },
  sub: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
  },
  time: {
    color: '#C5D0E0',
    fontSize: typography.fontSize.sm,
    marginBottom: 2,
  },
  cta: {
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
