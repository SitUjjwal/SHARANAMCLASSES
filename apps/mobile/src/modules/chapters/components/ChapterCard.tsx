/**
 * ChapterCard — matches syllabus list layout:
 *
 * Chapter 1
 * Introduction
 * 3 Videos
 * 2 PDFs
 * 1 Notes
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Chapter } from '@sharanam/shared';
import { colors, spacing, typography } from '@/theme';

export type ChapterCardProps = {
  chapter: Chapter;
  onPress: (chapter: Chapter) => void;
};

export function ChapterCard({ chapter, onPress }: ChapterCardProps) {
  const locked = chapter.is_locked;

  return (
    <Pressable
      style={styles.card}
      onPress={() => onPress(chapter)}
      accessibilityRole="button"
      accessibilityLabel={`Chapter ${chapter.chapter_number}. ${chapter.title}`}
      accessibilityState={{ disabled: locked }}
    >
      <View style={styles.headingRow}>
        <Text style={styles.chapterLabel}>Chapter {chapter.chapter_number}</Text>
        <View style={[styles.lockPill, locked ? styles.lockPillLocked : styles.lockPillOpen]}>
          <Ionicons
            name={locked ? 'lock-closed' : 'lock-open'}
            size={11}
            color={locked ? '#FFCDD2' : '#C8E6C9'}
          />
          <Text style={[styles.lockText, locked ? styles.lockTextLocked : styles.lockTextOpen]}>
            {locked ? 'Locked' : 'Unlocked'}
          </Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {chapter.title}
      </Text>

      <View style={styles.counts}>
        {chapter.video_count > 0 ? (
          <Text style={styles.countLine}>{chapter.video_count} Videos</Text>
        ) : null}
        {chapter.pdf_count > 0 ? (
          <Text style={styles.countLine}>{chapter.pdf_count} PDFs</Text>
        ) : null}
        {chapter.notes_count > 0 ? (
          <Text style={styles.countLine}>{chapter.notes_count} Notes</Text>
        ) : null}
        {!chapter.video_count && !chapter.pdf_count && !chapter.notes_count ? (
          <Text style={styles.countLine}>No content yet</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  chapterLabel: {
    color: colors.accent,
    fontSize: typography.fontSize.md,
    fontWeight: '800',
  },
  title: {
    color: colors.surface,
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    marginTop: 2,
  },
  counts: {
    marginTop: spacing.sm,
    gap: 2,
  },
  countLine: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
    lineHeight: 22,
  },
  lockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 999,
  },
  lockPillLocked: {
    backgroundColor: 'rgba(198,40,40,0.25)',
  },
  lockPillOpen: {
    backgroundColor: 'rgba(46,125,50,0.25)',
  },
  lockText: {
    fontSize: 11,
    fontWeight: '700',
  },
  lockTextLocked: {
    color: '#FFCDD2',
  },
  lockTextOpen: {
    color: '#C8E6C9',
  },
});
