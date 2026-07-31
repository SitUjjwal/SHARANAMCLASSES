/**
 * CourseListScreen — searchable, filterable, infinite-scroll catalog.
 *
 * Architecture
 * ------------
 * UI  → CourseSearchBar / CourseListFilters / FlatList(CourseCard)
 * Hook → useCourseListInfiniteQuery (React Query infinite cache)
 * API  → GET /courses?search&price&page… (Supabase + enrollments → is_purchased)
 *
 * Caching: each filter/search combo is a separate queryKey; pages append
 * under that key. Pull-to-refresh resets pages; onEndReached fetches next.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { CourseCard } from '@/modules/courses/components/CourseCard';
import {
  CourseListFilters,
  type CourseListFilterValues,
} from '@/modules/courses/components/CourseListFilters';
import { CourseListSkeleton } from '@/modules/courses/components/CourseListSkeleton';
import { CourseSearchBar } from '@/modules/courses/components/CourseSearchBar';
import { useCourseListInfiniteQuery } from '@/modules/courses/hooks/useCourseListInfiniteQuery';
import { useCategoriesQuery } from '@/modules/categories';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import type { AppStackParamList, MainTabParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { colors, spacing, typography } from '@/theme';
import type { CourseSummary } from '@sharanam/shared';

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'CoursesTab'>,
    NativeStackNavigationProp<AppStackParamList>
  >;
  route: RouteProp<MainTabParamList, 'CoursesTab'>;
};

function useDebouncedValue(value: string, delayMs = 350): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export function CourseListScreen({ navigation, route }: Props) {
  const categoryId = route.params?.categoryId;
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput);
  const [filters, setFilters] = useState<CourseListFilterValues>({
    price: 'all',
    featured: false,
    medium: undefined,
  });

  const categoriesQuery = useCategoriesQuery();
  const selectedCategory = categoriesQuery.data?.find((c) => c.id === categoryId);

  const listQuery = useCourseListInfiniteQuery({
    search: search || undefined,
    categoryId,
    featured: filters.featured || undefined,
    medium: filters.medium,
    price: filters.price,
    pageSize: 10,
  });

  const courses = useMemo(
    () => listQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [listQuery.data],
  );

  function openCourse(course: CourseSummary) {
    navigation.navigate('CourseDetail', { courseId: course.id });
  }

  function clearCategory() {
    navigation.setParams({ categoryId: undefined });
  }

  const showInitialSkeleton = listQuery.isLoading && !listQuery.data;
  const showError = listQuery.isError && !listQuery.data;

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <SectionHeader title={selectedCategory ? selectedCategory.name : 'Courses'} />
        {categoryId ? (
          <Pressable onPress={clearCategory} accessibilityRole="button">
            <Text style={styles.clear}>Clear category</Text>
          </Pressable>
        ) : null}
      </View>

      <CourseSearchBar value={searchInput} onChangeText={setSearchInput} />
      <View style={styles.filters}>
        <CourseListFilters value={filters} onChange={setFilters} />
      </View>

      {showInitialSkeleton ? <CourseListSkeleton /> : null}

      {showError ? (
        <ErrorState
          message={getApiErrorMessage(listQuery.error)}
          onRetry={() => {
            void listQuery.refetch();
          }}
        />
      ) : null}

      {!showInitialSkeleton && !showError ? (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.cell}>
              <CourseCard course={item} onPress={openCourse} />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="book-outline"
              title="No courses found"
              message={
                search || filters.price !== 'all' || filters.featured || filters.medium
                  ? 'Try clearing search or filters.'
                  : 'Published courses will appear here.'
              }
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={listQuery.isRefetching && !listQuery.isFetchingNextPage}
              onRefresh={() => {
                void listQuery.refetch();
              }}
              tintColor={colors.accent}
            />
          }
          onEndReached={() => {
            if (listQuery.hasNextPage && !listQuery.isFetchingNextPage) {
              void listQuery.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            listQuery.isFetchingNextPage ? (
              <View style={styles.footer}>
                <ActivityIndicator color={colors.accent} />
              </View>
            ) : null
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  clear: {
    color: colors.accent,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  filters: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
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
  cell: {
    flex: 1,
    maxWidth: '48%',
  },
  footer: {
    paddingVertical: spacing.lg,
  },
});
