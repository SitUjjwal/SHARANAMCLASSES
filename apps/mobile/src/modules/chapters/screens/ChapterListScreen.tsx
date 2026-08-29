/**
 * ChapterListScreen — chapter folders inside a subject (Classplus-style).
 *
 * CourseDetail / SubjectList → ChapterList → ChapterContent
 */
import { useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { FolderBrowserHeader } from '@/modules/folders/components/FolderBrowserHeader';
import { FolderRow } from '@/modules/folders/components/FolderRow';
import { folderTheme } from '@/modules/folders/theme';
import { useChaptersQuery } from '@/modules/chapters/hooks/useChaptersQuery';
import { useBatchSubjectChaptersQuery } from '@/modules/subjects/hooks/useBatchSubjectChaptersQuery';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import type { AppStackParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { spacing } from '@/theme';
import type { Chapter } from '@sharanam/shared';

type Props = NativeStackScreenProps<AppStackParamList, 'ChapterList'>;

export function ChapterListScreen({ navigation, route }: Props) {
  const { courseId, courseTitle, batchSubjectId, subjectName } = route.params;
  const courseChaptersQuery = useChaptersQuery(batchSubjectId ? '' : courseId);
  const subjectChaptersQuery = useBatchSubjectChaptersQuery(batchSubjectId);
  const chaptersQuery = batchSubjectId ? subjectChaptersQuery : courseChaptersQuery;
  const headerTitle = subjectName ?? courseTitle ?? 'Chapters';
  const [search, setSearch] = useState('');

  const folders = useMemo(() => {
    const items = chaptersQuery.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.title.toLowerCase().includes(q));
  }, [chaptersQuery.data, search]);

  function openChapter(chapter: Chapter) {
    if (chapter.is_locked) {
      Alert.alert(
        'Chapter locked',
        'Enroll in this course to unlock all chapters. Free preview chapters stay open.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'View course',
            onPress: () => navigation.navigate('CourseDetail', { courseId }),
          },
        ],
      );
      return;
    }
    navigation.navigate('ChapterContent', { courseId, chapterId: chapter.id });
  }

  return (
    <Screen style={styles.screen} canvasColor={folderTheme.canvas}>
      <FolderBrowserHeader
        title={headerTitle}
        search={search}
        onSearchChange={setSearch}
        onBack={() => navigation.goBack()}
      />

      {chaptersQuery.isLoading && !chaptersQuery.data ? (
        <View style={styles.skeleton}>
          <SkeletonBlock height={72} radius={16} />
          <SkeletonBlock height={72} radius={16} />
          <SkeletonBlock height={72} radius={16} />
        </View>
      ) : null}

      {chaptersQuery.isError && !chaptersQuery.data ? (
        <ErrorState
          message={getApiErrorMessage(chaptersQuery.error)}
          onRetry={() => {
            void chaptersQuery.refetch();
          }}
        />
      ) : null}

      {chaptersQuery.data ? (
        <FlatList
          data={folders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => (
            <FolderRow
              kind="folder"
              title={item.title}
              onPress={() => openChapter(item)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="folder-open-outline"
              title={search.trim() ? 'No folders match' : 'No chapters yet'}
              message={
                search.trim()
                  ? 'Try a different search.'
                  : 'Chapters will appear here when published.'
              }
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={chaptersQuery.isRefetching}
              onRefresh={() => {
                void chaptersQuery.refetch();
              }}
              tintColor={folderTheme.border}
            />
          }
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: folderTheme.canvas,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  sep: {
    height: spacing.md,
  },
  skeleton: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
});
