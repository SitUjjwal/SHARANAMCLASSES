/**
 * RelatedCourses — horizontal strip of same-category courses.
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { CourseSummary } from '@sharanam/shared';
import { CourseCard } from '@/modules/courses/components/CourseCard';
import { colors, spacing, typography } from '@/theme';

export type RelatedCoursesProps = {
  courses: CourseSummary[];
  onSelect: (course: CourseSummary) => void;
};

export function RelatedCourses({ courses, onSelect }: RelatedCoursesProps) {
  if (!courses.length) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Related Courses</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} width={200} onPress={onSelect} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  heading: {
    color: colors.surface,
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    paddingHorizontal: spacing.lg,
  },
  row: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
});
