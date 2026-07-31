/**
 * ChapterContentScreen — videos, PDFs, notes for one unlocked chapter.
 */
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useChapterContentQuery } from '@/modules/chapters/hooks/useChapterContentQuery';
import { formatDuration } from '@/modules/chapters/utils/formatDuration';
import { AppButton } from '@/components/ui/AppButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import type { AppStackParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { colors, spacing, typography } from '@/theme';
import type { ChapterContentItem, ChapterContentType } from '@sharanam/shared';

type Props = NativeStackScreenProps<AppStackParamList, 'ChapterContent'>;

function iconFor(type: ChapterContentType): keyof typeof Ionicons.glyphMap {
  if (type === 'video') return 'play-circle-outline';
  if (type === 'pdf') return 'document-text-outline';
  return 'newspaper-outline';
}

function labelFor(type: ChapterContentType): string {
  if (type === 'video') return 'Video';
  if (type === 'pdf') return 'PDF';
  return 'Note';
}

export function ChapterContentScreen({ navigation, route }: Props) {
  const { courseId, chapterId } = route.params;
  const insets = useSafeAreaInsets();
  const contentQuery = useChapterContentQuery(courseId, chapterId);

  async function openItem(item: ChapterContentItem) {
    if (item.url) {
      await Linking.openURL(item.url);
    }
  }

  if (contentQuery.isLoading && !contentQuery.data) {
    return (
      <Screen>
        <SkeletonBlock height={28} width="70%" />
        <SkeletonBlock height={72} />
        <SkeletonBlock height={72} />
      </Screen>
    );
  }

  if (contentQuery.isError || !contentQuery.data) {
    return (
      <Screen>
        <ErrorState
          message={getApiErrorMessage(contentQuery.error, 'Chapter not found.')}
          onRetry={() => {
            void contentQuery.refetch();
          }}
        />
        <AppButton label="Go back" variant="ghost" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  const chapter = contentQuery.data;

  if (chapter.is_locked) {
    return (
      <Screen style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.surface} />
          </Pressable>
          <Text style={styles.title}>Chapter {chapter.chapter_number}</Text>
        </View>
        <View style={styles.body}>
          <EmptyState
            icon="lock-closed-outline"
            title="Chapter locked"
            message="Enroll in this course to unlock videos, PDFs, and notes."
          />
          <AppButton
            label="View course"
            onPress={() => navigation.navigate('CourseDetail', { courseId })}
          />
        </View>
      </Screen>
    );
  }

  const videos = chapter.contents.filter((item) => item.content_type === 'video');
  const pdfs = chapter.contents.filter((item) => item.content_type === 'pdf');
  const notes = chapter.contents.filter((item) => item.content_type === 'note');

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.surface} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.kicker}>
              Chapter {chapter.chapter_number} · {formatDuration(chapter.duration_seconds)}
            </Text>
            <Text style={styles.title}>{chapter.title}</Text>
            <Text style={styles.subtitle}>{chapter.course_title}</Text>
          </View>
        </View>

        <View style={styles.body}>
          {chapter.description ? (
            <Text style={styles.description}>{chapter.description}</Text>
          ) : null}

          {!chapter.contents.length ? (
            <EmptyState
              icon="folder-open-outline"
              title="No content yet"
              message="Videos, PDFs, and notes will appear here when published."
            />
          ) : null}

          <ContentSection title="Videos" items={videos} onOpen={openItem} />
          <ContentSection title="PDFs" items={pdfs} onOpen={openItem} />
          <ContentSection title="Notes" items={notes} onOpen={openItem} />
        </View>
      </ScrollView>
    </Screen>
  );
}

function ContentSection({
  title,
  items,
  onOpen,
}: {
  title: string;
  items: ChapterContentItem[];
  onOpen: (item: ChapterContentItem) => void;
}) {
  if (!items.length) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item) => (
        <Pressable
          key={item.id}
          style={styles.item}
          onPress={() => onOpen(item)}
          disabled={!item.url && !item.body}
        >
          <Ionicons name={iconFor(item.content_type)} size={22} color={colors.accent} />
          <View style={styles.itemBody}>
            <Text style={styles.itemType}>{labelFor(item.content_type)}</Text>
            <Text style={styles.itemTitle}>{item.title}</Text>
            {item.content_type === 'video' && item.duration_seconds ? (
              <Text style={styles.itemMeta}>{formatDuration(item.duration_seconds)}</Text>
            ) : null}
            {item.content_type === 'note' && item.body ? (
              <Text style={styles.itemNote}>{item.body}</Text>
            ) : null}
          </View>
          {item.url ? (
            <Ionicons name="open-outline" size={18} color="#A8B3C5" />
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  scroll: {
    paddingBottom: spacing.xl * 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  kicker: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  title: {
    color: colors.surface,
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
  },
  subtitle: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
  },
  body: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  description: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
    lineHeight: 22,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.surface,
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  itemBody: {
    flex: 1,
    gap: 2,
  },
  itemType: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  itemTitle: {
    color: colors.surface,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  itemMeta: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
  },
  itemNote: {
    marginTop: 4,
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
    lineHeight: 20,
  },
});
