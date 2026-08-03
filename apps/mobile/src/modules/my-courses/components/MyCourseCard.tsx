/**
 * MyCourseCard — full course banner + progress + Continue/Review CTA.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { MyCourseItem } from '@sharanam/shared';

import { ProgressBar } from '@/modules/my-courses/components/ProgressBar';
import { bookIconForTitle } from '@/modules/my-courses/utils/bookIcon';
import { useAppTheme } from '@/theme/ThemeProvider';
import { colors, spacing, typography } from '@/theme';

type Props = {
  item: MyCourseItem;
  onOpenCourse: (item: MyCourseItem) => void;
  onContinue: (item: MyCourseItem) => void;
};

export function MyCourseCard({ item, onOpenCourse, onContinue }: Props) {
  const theme = useAppTheme();
  const isDark = theme.canvas === '#0B1F3A';
  const percent = Math.min(100, Math.max(0, Math.round(item.progress_percent)));
  const icon = bookIconForTitle(item.title);
  const done = percent >= 100;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
          borderColor: theme.cardBorder,
        },
      ]}
    >
      <Pressable
        onPress={() => onOpenCourse(item)}
        accessibilityRole="button"
        accessibilityLabel={item.title}
      >
        <View style={styles.bannerWrap}>
          {item.thumbnail_url ? (
            <Image
              source={{ uri: item.thumbnail_url }}
              style={styles.banner}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={item.course_id}
              transition={180}
              accessibilityLabel={`${item.title} banner`}
            />
          ) : (
            <View
              style={[
                styles.banner,
                styles.bannerFallback,
                {
                  backgroundColor: isDark
                    ? 'rgba(201,162,39,0.16)'
                    : 'rgba(201,162,39,0.12)',
                },
              ]}
            >
              <Text style={styles.emoji}>{icon}</Text>
            </View>
          )}

          <View
            style={[
              styles.percentChip,
              {
                backgroundColor: done
                  ? 'rgba(20,40,30,0.88)'
                  : 'rgba(11,31,58,0.88)',
              },
            ]}
          >
            <Text style={[styles.percentText, { color: done ? '#81C784' : colors.accent }]}>
              {percent}%
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={2}>
            {item.title}
          </Text>

          {item.teacher_name ? (
            <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={1}>
              {item.teacher_name}
            </Text>
          ) : null}

          <ProgressBar percent={percent} />

          {item.last_watched_chapter_title ? (
            <Text style={[styles.lastWatched, { color: theme.textSecondary }]} numberOfLines={1}>
              Last: {item.last_watched_chapter_title}
            </Text>
          ) : (
            <Text style={[styles.lastWatched, { color: theme.textSecondary }]}>
              {done ? 'Completed' : 'Ready to start'}
            </Text>
          )}
        </View>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.continueBtn, { opacity: pressed ? 0.88 : 1 }]}
        onPress={() => onContinue(item)}
        accessibilityRole="button"
        accessibilityLabel={done ? 'Review course' : 'Continue learning'}
      >
        <Text style={styles.continueText}>{done ? 'Review' : 'Continue'}</Text>
        <Ionicons name="play" size={14} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    paddingBottom: spacing.md,
  },
  bannerWrap: {
    width: '100%',
    height: 168,
    backgroundColor: colors.secondary,
    position: 'relative',
  },
  banner: {
    width: '100%',
    height: '100%',
  },
  bannerFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 48,
  },
  percentChip: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  percentText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '800',
  },
  body: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: 6,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
    lineHeight: 26,
  },
  meta: {
    fontSize: typography.fontSize.sm,
  },
  lastWatched: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  continueBtn: {
    marginTop: spacing.md,
    marginHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  continueText: {
    color: colors.primary,
    fontSize: typography.fontSize.md,
    fontWeight: '800',
  },
});
