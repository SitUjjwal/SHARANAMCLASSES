/**
 * MyCoursesScreen — clean owned-course library (no search bar).
 */
import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MyCourseItem } from '@sharanam/shared';

import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { MyCourseCard } from '@/modules/my-courses/components/MyCourseCard';
import { useMyCoursesQuery } from '@/modules/my-courses/hooks/useMyCoursesQuery';
import type { AppStackParamList, MainTabParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { useAppTheme } from '@/theme/ThemeProvider';
import { colors, spacing, typography } from '@/theme';

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'MyLearningTab'>,
    NativeStackNavigationProp<AppStackParamList>
  >;
};

export function MyCoursesScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const myCoursesQuery = useMyCoursesQuery();
  const items = myCoursesQuery.data?.items ?? [];
  const total = myCoursesQuery.data?.total ?? items.length;

  function openCourse(item: MyCourseItem) {
    navigation.navigate('CourseDetail', { courseId: item.course_id });
  }

  function continueLearning(item: MyCourseItem) {
    if (item.last_watched_chapter_id) {
      navigation.navigate('ChapterContent', {
        courseId: item.course_id,
        chapterId: item.last_watched_chapter_id,
      });
      return;
    }
    openCourse(item);
  }

  const listHeader = (
    <View style={styles.headerBlock}>
      <View style={styles.hero}>
        <View style={styles.titleRow}>
          <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>My Courses</Text>
          {items.length > 0 ? (
            <View style={styles.countChip}>
              <Text style={styles.countChipText}>
                {total > 99 ? '99+' : total} enrolled
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Continue learning from where you left off.
        </Text>
      </View>
    </View>
  );

  return (
    <Screen style={styles.screen}>
      {myCoursesQuery.isLoading && !myCoursesQuery.data ? (
        <View style={styles.skeleton}>
          <SkeletonBlock height={56} radius={12} />
          <SkeletonBlock height={148} radius={16} />
          <SkeletonBlock height={148} radius={16} />
        </View>
      ) : null}

      {myCoursesQuery.isError && !myCoursesQuery.data ? (
        <ErrorState
          message={getApiErrorMessage(myCoursesQuery.error)}
          onRetry={() => {
            void myCoursesQuery.refetch();
          }}
        />
      ) : null}

      {myCoursesQuery.data ? (
        <FlatList
          data={items}
          keyExtractor={(item) => item.enrollment_id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={listHeader}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <EmptyState
                icon="school-outline"
                title="No courses yet"
                message="Purchase or enroll in a course to see it here."
              />
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <MyCourseCard
                item={item}
                onOpenCourse={openCourse}
                onContinue={continueLearning}
              />
            </View>
          )}
          refreshing={myCoursesQuery.isRefetching && !myCoursesQuery.isLoading}
          onRefresh={() => {
            void myCoursesQuery.refetch();
          }}
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
  list: {
    paddingBottom: spacing.xl * 2,
    flexGrow: 1,
  },
  headerBlock: {
    paddingBottom: spacing.md,
  },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  pageTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  countChip: {
    backgroundColor: 'rgba(201,162,39,0.18)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countChipText: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    lineHeight: 20,
  },
  separator: {
    height: spacing.md,
  },
  cardWrap: {
    paddingHorizontal: spacing.lg,
  },
  emptyWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  skeleton: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
});
