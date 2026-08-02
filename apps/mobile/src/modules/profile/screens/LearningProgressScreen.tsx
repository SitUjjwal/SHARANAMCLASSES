/**
 * LearningProgressScreen — completed / remaining chapters, overall %, continue learning.
 */
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Screen } from '@/components/ui/Screen';
import { ContinueLearningCard } from '@/modules/profile/components/ContinueLearningCard';
import { LearningProgressSummaryCard } from '@/modules/profile/components/LearningProgressSummaryCard';
import { ProgressCard } from '@/modules/profile/components/ProgressCard';
import { useLearningProgressQuery } from '@/modules/profile/hooks/useLearningProgressQuery';
import type { AppStackParamList } from '@/types/navigation';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'LearningProgress'>;

export function LearningProgressScreen({ navigation }: Props) {
  const progressQuery = useLearningProgressQuery();
  const data = progressQuery.data;
  const showInitialLoading = progressQuery.isPending && !data;

  const errorMessage =
    progressQuery.error instanceof Error
      ? progressQuery.error.message
      : progressQuery.isError
        ? 'Failed to load progress'
        : null;

  function openContinue(courseId: string, chapterId: string) {
    navigation.navigate('ChapterContent', { courseId, chapterId });
  }

  return (
    <Screen>
      <LoadingOverlay visible={showInitialLoading} message="Loading progress…" />

      {errorMessage && !data ? (
        <ErrorState
          message={errorMessage}
          onRetry={() => {
            void progressQuery.refetch();
          }}
        />
      ) : null}

      {data ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={progressQuery.isRefetching && !showInitialLoading}
              onRefresh={() => {
                void progressQuery.refetch();
              }}
              tintColor={colors.accent}
            />
          }
        >
          <Text style={styles.title}>Learning Progress</Text>
          <Text style={styles.subtitle}>
            Progress is based on chapters completed through your last watched lesson.
          </Text>

          <LearningProgressSummaryCard
            completedChapters={data.completed_chapters}
            remainingChapters={data.remaining_chapters}
            overallPercentage={data.overall_percentage}
          />

          <ContinueLearningCard
            continueLearning={data.continue_learning}
            lastWatchedVideo={data.last_watched_video}
            onContinue={() => {
              if (!data.continue_learning) return;
              openContinue(
                data.continue_learning.course_id,
                data.continue_learning.chapter_id,
              );
            }}
          />

          <Text style={styles.section}>Courses</Text>

          {data.courses.length === 0 ? (
            <EmptyState
              icon="book-outline"
              title="No courses yet"
              message="Enroll in a course to track progress here."
            />
          ) : (
            <View style={styles.list}>
              {data.courses.map((course) => (
                <ProgressCard
                  key={course.course_id}
                  course={course}
                  onPress={() =>
                    navigation.navigate('CourseDetail', { courseId: course.course_id })
                  }
                  onContinue={
                    course.last_watched_chapter_id
                      ? () =>
                          openContinue(
                            course.course_id,
                            course.last_watched_chapter_id as string,
                          )
                      : undefined
                  }
                />
              ))}
            </View>
          )}
        </ScrollView>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.md, paddingBottom: spacing.xl },
  title: {
    color: colors.surface,
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
  },
  subtitle: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
    lineHeight: 20,
    marginTop: -spacing.xs,
  },
  section: {
    marginTop: spacing.sm,
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: { gap: spacing.sm },
});
