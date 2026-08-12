/**
 * ChapterListScreen — full syllabus for a course.
 *
 * Architecture
 * ------------
 * CourseDetail → ChapterList { courseId } → ChapterContent { courseId, chapterId }
 * Data: GET /courses/:courseId/chapters → ChapterCard list
 * Lock: is_locked from API (enrolled OR free preview → unlocked)
 */
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChapterCard } from '@/modules/chapters/components/ChapterCard';
import { useChaptersQuery } from '@/modules/chapters/hooks/useChaptersQuery';
import { useBatchSubjectChaptersQuery } from '@/modules/subjects/hooks/useBatchSubjectChaptersQuery';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import type { AppStackParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { colors, spacing, typography } from '@/theme';
import type { Chapter } from '@sharanam/shared';

type Props = NativeStackScreenProps<AppStackParamList, 'ChapterList'>;

export function ChapterListScreen({ navigation, route }: Props) {
  const { courseId, courseTitle, batchSubjectId, subjectName } = route.params;
  const insets = useSafeAreaInsets();
  // Batch subject flow fetches via /student/batch-subjects/:id/chapters;
  // legacy flow keeps the course endpoint. Only one query is enabled.
  const courseChaptersQuery = useChaptersQuery(batchSubjectId ? '' : courseId);
  const subjectChaptersQuery = useBatchSubjectChaptersQuery(batchSubjectId);
  const chaptersQuery = batchSubjectId ? subjectChaptersQuery : courseChaptersQuery;
  const headerSubtitle = subjectName ?? courseTitle;

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
    <Screen style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={colors.surface} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Chapters</Text>
          {headerSubtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {headerSubtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {chaptersQuery.isLoading && !chaptersQuery.data ? (
        <View style={styles.skeleton}>
          <SkeletonBlock height={96} radius={14} />
          <SkeletonBlock height={96} radius={14} />
          <SkeletonBlock height={96} radius={14} />
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
          data={chaptersQuery.data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => <ChapterCard chapter={item} onPress={openChapter} />}
          ListEmptyComponent={
            <EmptyState
              icon="list-outline"
              title="No chapters yet"
              message="Chapters will appear here when published."
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={chaptersQuery.isRefetching}
              onRefresh={() => {
                void chaptersQuery.refetch();
              }}
              tintColor={colors.accent}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
    gap: 2,
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
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  sep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginVertical: spacing.xs,
  },
  skeleton: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
});
