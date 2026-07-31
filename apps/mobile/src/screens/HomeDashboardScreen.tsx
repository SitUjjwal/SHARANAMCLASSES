/**
 * Home Dashboard — production layout:
 * Greeting → Quote of the Day → Banner Slider → Categories →
 * Featured Courses → My Courses → Latest Updates
 *
 * Data: GET /dashboard via useDashboardQuery (React Query).
 * Bottom tabs: Home | Courses | My Learning | Profile.
 */
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  BannerSlider,
  CategoriesGrid,
  CourseHorizontalList,
  GreetingHeader,
  HomeDashboardSkeleton,
  QuoteCard,
  UpdatesList,
} from '@/components/dashboard';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useDashboardQuery } from '@/hooks/useDashboardQuery';
import type { AppStackParamList, MainTabParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { spacing } from '@/theme';
import type { Category, CourseSummary } from '@sharanam/shared';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'HomeTab'>,
  NativeStackNavigationProp<AppStackParamList>
>;

type Props = {
  navigation: Nav;
};

export function HomeDashboardScreen({ navigation }: Props) {
  const dashboardQuery = useDashboardQuery();

  function openCourse(course: CourseSummary) {
    navigation.navigate('CourseDetail', { courseId: course.id });
  }

  function openCategory(category: Category) {
    navigation.navigate('CoursesTab', { categoryId: category.id });
  }

  function openCoursesTab() {
    navigation.navigate('CoursesTab', {});
  }

  function openMyLearningTab() {
    navigation.navigate('MyLearningTab');
  }

  if (dashboardQuery.isLoading && !dashboardQuery.data) {
    return (
      <Screen style={styles.screen}>
        <HomeDashboardSkeleton />
      </Screen>
    );
  }

  if (dashboardQuery.isError && !dashboardQuery.data) {
    return (
      <Screen style={styles.screen}>
        <ErrorState
          message={getApiErrorMessage(dashboardQuery.error)}
          onRetry={() => {
            void dashboardQuery.refetch();
          }}
        />
      </Screen>
    );
  }

  const data = dashboardQuery.data;

  return (
    <Screen style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={dashboardQuery.isRefetching && !dashboardQuery.isLoading}
            onRefresh={() => {
              void dashboardQuery.refetch();
            }}
            tintColor="#C9A227"
          />
        }
      >
        <GreetingHeader name={data?.greeting_name ?? 'Student'} />

        <View style={styles.section}>
          <SectionHeader title="Quote of the Day" />
          <QuoteCard quote={data?.quote ?? null} />
        </View>

        <View style={styles.section}>
          <SectionHeader title="Banner Slider" />
          <BannerSlider banners={data?.banners ?? []} />
        </View>

        <View style={styles.section}>
          <SectionHeader title="Categories" />
          <CategoriesGrid categories={data?.categories ?? []} onSelect={openCategory} />
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Featured Courses"
            actionLabel="See all"
            onActionPress={openCoursesTab}
          />
          <CourseHorizontalList
            courses={data?.featured_courses ?? []}
            emptyTitle="No featured courses"
            emptyMessage="Published featured courses will appear here as course cards."
            onPressCourse={openCourse}
          />
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="My Courses"
            actionLabel="See all"
            onActionPress={openMyLearningTab}
          />
          <CourseHorizontalList
            enrollments={data?.my_courses ?? []}
            emptyTitle="No enrollments yet"
            emptyMessage="When you enroll in a course, it will show up here."
            onPressCourse={openCourse}
          />
        </View>

        <View style={styles.section}>
          <SectionHeader title="Latest Updates" />
          <UpdatesList updates={data?.latest_updates ?? []} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl * 2,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
});
