/**
 * Home Dashboard — production layout:
 * Greeting → Banner → Categories → Featured → My Courses →
 * Live Classes → Quote of the Day (bottom)
 *
 * Announcements / holiday notices live in Notification Center only.
 * Continue Watching is intentionally not shown on Home.
 */
import { useCallback, useMemo } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { DrawerActions, type CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  BannerSlider,
  CategoriesGrid,
  CourseHorizontalList,
  GreetingHeader,
  HomeDashboardSkeleton,
  QuoteCard,
} from '@/components/dashboard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useDashboardQuery } from '@/hooks/useDashboardQuery';
import { LiveClassCard } from '@/modules/live-classes/components/LiveClassCard';
import { useLiveClassesQuery } from '@/modules/live-classes/hooks/useLiveClassesQuery';
import { useUnreadNotificationCountQuery } from '@/modules/notifications/hooks/useUnreadNotificationCountQuery';
import { openBannerRedirect } from '@/modules/banners/openBannerRedirect';
import { openCategoryExternalLink } from '@/modules/categories/utils/openCategoryAction';
import { openInYouTubeApp } from '@/modules/videos/utils/openYouTube';
import { extractYouTubeVideoId } from '@/modules/videos/utils/youtube';
import type {
  AppStackParamList,
  MainDrawerParamList,
  MainTabParamList,
} from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { spacing } from '@/theme';
import type { Category, CourseSummary, LiveClassPublic } from '@sharanam/shared';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'HomeTab'>,
  CompositeNavigationProp<
    DrawerNavigationProp<MainDrawerParamList>,
    NativeStackNavigationProp<AppStackParamList>
  >
>;

type Props = {
  navigation: Nav;
};

export function HomeDashboardScreen({ navigation }: Props) {
  const dashboardQuery = useDashboardQuery();
  const liveQuery = useLiveClassesQuery();
  const unreadQuery = useUnreadNotificationCountQuery();

  const homeLiveClasses = useMemo(() => {
    const items = liveQuery.data ?? [];
    const now = Date.now();
    const liveNow: LiveClassPublic[] = [];
    const upcoming: LiveClassPublic[] = [];
    for (const item of items) {
      const start = Date.parse(item.start_time);
      const end = Date.parse(item.end_time);
      if (item.status === 'live' || (start <= now && end >= now && item.status !== 'ended')) {
        liveNow.push(item);
      } else if (item.status === 'upcoming' && start > now) {
        upcoming.push(item);
      }
    }
    return [...liveNow, ...upcoming].slice(0, 3);
  }, [liveQuery.data]);

  function openCourse(course: CourseSummary) {
    navigation.navigate('CourseDetail', { courseId: course.id });
  }

  async function openCategory(category: Category) {
    if (await openCategoryExternalLink(category)) return;
    navigation.navigate('CoursesTab', { categoryId: category.id });
  }

  function openCoursesTab() {
    navigation.navigate('CoursesTab', {});
  }

  function openMyLearningTab() {
    navigation.navigate('MyLearningTab');
  }

  function openLiveTab() {
    navigation.navigate('LiveTab');
  }

  function openMenu() {
    navigation.dispatch(DrawerActions.openDrawer());
  }

  function openNotifications() {
    navigation.navigate('NotificationCenter');
  }

  const onJoinLive = useCallback((liveClass: LiveClassPublic) => {
    const youtubeUrl = liveClass.youtube_url?.trim() ?? '';
    const videoId = extractYouTubeVideoId(youtubeUrl);
    if (!videoId) {
      Alert.alert('Invalid link', 'This live class does not have a valid YouTube URL.');
      return;
    }
    void openInYouTubeApp({ youtubeUrl, videoId });
  }, []);

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
            refreshing={
              (dashboardQuery.isRefetching && !dashboardQuery.isLoading) ||
              (liveQuery.isRefetching && !liveQuery.isLoading)
            }
            onRefresh={() => {
              void dashboardQuery.refetch();
              void liveQuery.refetch();
              void unreadQuery.refetch();
            }}
            tintColor="#C9A227"
          />
        }
      >
        <GreetingHeader
          name={data?.greeting_name ?? 'Student'}
          onMenuPress={openMenu}
          onSearchPress={openCoursesTab}
          onNotificationsPress={openNotifications}
          unreadCount={unreadQuery.data ?? 0}
        />

        <View style={styles.section}>
          <BannerSlider
            banners={data?.banners ?? []}
            onBannerPress={(banner) => {
              void openBannerRedirect(banner);
            }}
          />
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
          <SectionHeader
            title="Live Classes"
            actionLabel="See all"
            onActionPress={openLiveTab}
          />
          {homeLiveClasses.length ? (
            <View style={styles.liveList}>
              {homeLiveClasses.map((item) => (
                <LiveClassCard key={item.id} liveClass={item} onJoin={onJoinLive} />
              ))}
            </View>
          ) : (
            <EmptyState
              icon="radio-outline"
              title="No live classes"
              message="Upcoming live sessions will appear here."
            />
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Quote of the Day" />
          <QuoteCard quote={data?.quote ?? null} />
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
  liveList: {
    gap: spacing.sm,
  },
});
