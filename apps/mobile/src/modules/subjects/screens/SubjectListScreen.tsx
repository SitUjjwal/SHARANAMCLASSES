/**
 * SubjectListScreen — folders inside a purchased batch (Classplus-style).
 *
 * Flow: Batch click → SubjectList { batchId, batchTitle } → ChapterList
 * Data: GET /student/batches/:batchId/subjects
 */
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { StudentBatchSubject } from '@sharanam/shared';

import { FolderBrowserHeader } from '@/modules/folders/components/FolderBrowserHeader';
import { FolderRow } from '@/modules/folders/components/FolderRow';
import { folderTheme } from '@/modules/folders/theme';
import { useBatchSubjectsQuery } from '@/modules/subjects/hooks/useBatchSubjectsQuery';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import type { AppStackParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { spacing } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'SubjectList'>;

export function SubjectListScreen({ navigation, route }: Props) {
  const { batchId, batchTitle } = route.params;
  const subjectsQuery = useBatchSubjectsQuery(batchId);
  const [search, setSearch] = useState('');

  const folders = useMemo(() => {
    const items = subjectsQuery.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [search, subjectsQuery.data]);

  function openSubject(subject: StudentBatchSubject) {
    navigation.navigate('ChapterList', {
      courseId: batchId,
      courseTitle: batchTitle,
      batchSubjectId: subject.id,
      subjectName: subject.name,
    });
  }

  return (
    <Screen style={styles.screen} canvasColor={folderTheme.canvas}>
      <FolderBrowserHeader
        title={batchTitle || 'Batch'}
        search={search}
        onSearchChange={setSearch}
        onBack={() => navigation.goBack()}
      />

      {subjectsQuery.isLoading && !subjectsQuery.data ? (
        <View style={styles.skeleton}>
          <SkeletonBlock height={72} radius={16} />
          <SkeletonBlock height={72} radius={16} />
          <SkeletonBlock height={72} radius={16} />
        </View>
      ) : null}

      {subjectsQuery.isError && !subjectsQuery.data ? (
        <ErrorState
          message={getApiErrorMessage(subjectsQuery.error)}
          onRetry={() => {
            void subjectsQuery.refetch();
          }}
        />
      ) : null}

      {subjectsQuery.data ? (
        <FlatList
          data={folders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => (
            <FolderRow kind="folder" title={item.name} onPress={() => openSubject(item)} />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="folder-open-outline"
              title={search.trim() ? 'No folders match' : 'No folders yet'}
              message={
                search.trim()
                  ? 'Try a different search.'
                  : 'Folders will appear here when published.'
              }
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={subjectsQuery.isRefetching}
              onRefresh={() => {
                void subjectsQuery.refetch();
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
