/**
 * MyCoursesScreen — simple owned-course list:
 *
 * My Courses
 * 📘 Mathematics · 45% · Continue
 * --------------------
 * 📙 Science · 20% · Continue
 */
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MyCourseItem } from '@sharanam/shared';

import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { CourseSearchBar } from '@/modules/courses/components/CourseSearchBar';
import { MyCourseCard } from '@/modules/my-courses/components/MyCourseCard';
import { useMyCoursesQuery } from '@/modules/my-courses/hooks/useMyCoursesQuery';
import type { AppStackParamList, MainTabParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { spacing } from '@/theme';

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'MyLearningTab'>,
    NativeStackNavigationProp<AppStackParamList>
  >;
};

export function MyCoursesScreen({ navigation }: Props) {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const myCoursesQuery = useMyCoursesQuery(debouncedSearch);
  const items = myCoursesQuery.data?.items ?? [];

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

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <SectionHeader title="My Courses" />
      </View>

      <CourseSearchBar value={searchInput} onChangeText={setSearchInput} />

      {myCoursesQuery.isLoading && !myCoursesQuery.data ? (
        <View style={styles.skeleton}>
          <SkeletonBlock height={96} radius={10} />
          <SkeletonBlock height={96} radius={10} />
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
          ListEmptyComponent={
            <EmptyState
              icon="school-outline"
              title={debouncedSearch ? 'No matches' : 'No courses yet'}
              message={
                debouncedSearch
                  ? 'Try a different search.'
                  : 'Purchase or enroll in a course to see it here.'
              }
            />
          }
          renderItem={({ item }) => (
            <MyCourseCard
              item={item}
              onOpenCourse={openCourse}
              onContinue={continueLearning}
            />
          )}
          refreshing={myCoursesQuery.isRefetching}
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  list: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  skeleton: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginTop: spacing.md,
  },
});
