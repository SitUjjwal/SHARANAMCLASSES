/**
 * CourseHorizontalList — featured / my-courses row.
 * Why: keeps Home scannable; full list lives on Courses tab.
 */
import { FlatList, StyleSheet, View } from 'react-native';

import type { CourseSummary, Enrollment } from '@sharanam/shared';
import { CourseCard } from '@/components/dashboard/CourseCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { spacing } from '@/theme';

type CourseHorizontalListProps = {
  courses?: CourseSummary[];
  enrollments?: Enrollment[];
  emptyTitle: string;
  emptyMessage: string;
  onPressCourse: (course: CourseSummary) => void;
};

export function CourseHorizontalList({
  courses,
  enrollments,
  emptyTitle,
  emptyMessage,
  onPressCourse,
}: CourseHorizontalListProps) {
  const fromEnrollments =
    enrollments
      ?.map((row) => row.course)
      .filter((course): course is CourseSummary => Boolean(course)) ?? [];

  const items = courses ?? fromEnrollments;

  if (!items.length) {
    return <EmptyState icon="book-outline" title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <FlatList
      horizontal
      data={items}
      keyExtractor={(item) => item.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <CourseCard course={item} onPress={onPressCourse} width={200} />
      )}
      ItemSeparatorComponent={() => <View style={{ width: spacing.sm }} />}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingRight: spacing.md,
  },
});
