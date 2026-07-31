/**
 * My Learning tab — enrolled courses from dashboard enrollments.
 * Why: dedicated place for progress without mixing browse catalog.
 */
import { FlatList, StyleSheet, View } from 'react-native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { CourseCard } from '@/components/dashboard/CourseCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { useDashboardQuery } from '@/hooks/useDashboardQuery';
import type { AppStackParamList, MainTabParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { spacing } from '@/theme';
import type { CourseSummary, Enrollment } from '@sharanam/shared';

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'MyLearningTab'>,
    NativeStackNavigationProp<AppStackParamList>
  >;
};

export function MyLearningScreen({ navigation }: Props) {
  const dashboardQuery = useDashboardQuery();

  const courses =
    dashboardQuery.data?.my_courses
      .map((row: Enrollment) => row.course)
      .filter((course): course is CourseSummary => Boolean(course)) ?? [];

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <SectionHeader title="My learning" />
      </View>

      {dashboardQuery.isLoading && !dashboardQuery.data ? (
        <View style={styles.skeleton}>
          <SkeletonBlock height={160} radius={14} />
        </View>
      ) : null}

      {dashboardQuery.isError && !dashboardQuery.data ? (
        <ErrorState
          message={getApiErrorMessage(dashboardQuery.error)}
          onRetry={() => {
            void dashboardQuery.refetch();
          }}
        />
      ) : null}

      {dashboardQuery.data ? (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="school-outline"
              title="Nothing enrolled"
              message="Browse courses and enroll to track them here."
            />
          }
          renderItem={({ item }) => (
            <CourseCard
              course={item}
              onPress={(course) =>
                navigation.navigate('CourseDetail', { courseId: course.id })
              }
            />
          )}
          refreshing={dashboardQuery.isRefetching}
          onRefresh={() => {
            void dashboardQuery.refetch();
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl * 2,
    gap: spacing.md,
  },
  row: {
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  skeleton: {
    paddingHorizontal: spacing.lg,
  },
});
