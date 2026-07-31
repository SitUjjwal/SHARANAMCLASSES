/**
 * ChapterList — compact preview on Course Details (opens full Chapter List).
 */
import { StyleSheet, Text, View } from 'react-native';

import type { Chapter } from '@sharanam/shared';
import { ChapterCard } from '@/modules/chapters/components/ChapterCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { spacing } from '@/theme';

export type ChapterListProps = {
  chapters: Chapter[];
  onOpenChapter: (chapter: Chapter) => void;
  onSeeAll?: () => void;
};

export function ChapterList({ chapters, onOpenChapter, onSeeAll }: ChapterListProps) {
  const preview = chapters.slice(0, 3);

  return (
    <View style={styles.wrap}>
      <SectionHeader
        title="Chapters"
        actionLabel={chapters.length > 3 ? 'See all' : undefined}
        onActionPress={onSeeAll}
      />
      {!chapters.length ? (
        <EmptyState
          icon="list-outline"
          title="No chapters yet"
          message="Chapters will appear here when the admin publishes them."
        />
      ) : (
        <View style={styles.list}>
          {preview.map((chapter, index) => (
            <View
              key={chapter.id}
              style={index < preview.length - 1 ? styles.cardWrap : undefined}
            >
              <ChapterCard chapter={chapter} onPress={onOpenChapter} />
            </View>
          ))}
          {chapters.length > 3 && onSeeAll ? (
            <Text style={styles.more} onPress={onSeeAll}>
              View all {chapters.length} chapters
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  list: {
    gap: 0,
  },
  more: {
    color: '#C9A227',
    fontWeight: '700',
    paddingVertical: spacing.sm,
  },
  // Dividers between preview cards (same as Chapter List screen)
  cardWrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.18)',
  },
});
