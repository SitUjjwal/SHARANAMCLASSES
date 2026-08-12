/**
 * SubjectCard — one subject tile inside a batch.
 * Icon/thumbnail (or lettered circle fallback) + name, teacher, counts, progress.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { StudentBatchSubject } from '@sharanam/shared';

import { ProgressBar } from '@/modules/my-courses/components/ProgressBar';
import { useAppTheme } from '@/theme/ThemeProvider';
import { colors, spacing, typography } from '@/theme';

type Props = {
  subject: StudentBatchSubject;
  onPress: (subject: StudentBatchSubject) => void;
};

const AVATAR_PALETTE = ['#1E4D7B', '#7B4D1E', '#4D1E7B', '#1E7B4D', '#7B1E3A'] as const;

function isHttpUrl(value: string | null): value is string {
  return Boolean(value && /^https?:\/\//i.test(value));
}

export function SubjectCard({ subject, onPress }: Props) {
  const theme = useAppTheme();
  const isDark = theme.canvas === '#0B1F3A';
  const percent = Math.min(100, Math.max(0, Math.round(subject.progress_percent)));
  const imageUrl = isHttpUrl(subject.icon_url)
    ? subject.icon_url
    : isHttpUrl(subject.thumbnail_url)
      ? subject.thumbnail_url
      : null;
  const initial = subject.name.trim().charAt(0).toUpperCase() || '?';
  const avatarColor =
    AVATAR_PALETTE[
      Math.abs(subject.sort_order) % AVATAR_PALETTE.length
    ] ?? AVATAR_PALETTE[0];

  return (
    <Pressable
      onPress={() => onPress(subject)}
      accessibilityRole="button"
      accessibilityLabel={subject.name}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
          borderColor: theme.cardBorder,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={styles.row}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.avatar}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={subject.id}
            transition={180}
            accessibilityLabel={`${subject.name} icon`}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarLetter}>{initial}</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={2}>
            {subject.name}
          </Text>
          {subject.teacher_name ? (
            <Text style={[styles.teacher, { color: theme.textSecondary }]} numberOfLines={1}>
              {subject.teacher_name}
            </Text>
          ) : null}
          <Text style={[styles.counts, { color: theme.textSecondary }]} numberOfLines={1}>
            {subject.chapter_count} Chapter{subject.chapter_count === 1 ? '' : 's'} ·{' '}
            {subject.video_count} Video{subject.video_count === 1 ? '' : 's'}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      </View>

      <View style={styles.progressBlock}>
        <View style={styles.progressLabelRow}>
          <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>Progress</Text>
          <Text style={styles.progressPercent}>{percent}%</Text>
        </View>
        <ProgressBar percent={percent} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.secondary,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
  },
  teacher: {
    fontSize: typography.fontSize.sm,
  },
  counts: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  progressBlock: {
    gap: 4,
  },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  progressPercent: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: '800',
  },
});
