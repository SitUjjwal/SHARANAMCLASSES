/**
 * Course Details Screen
 *
 * Layout: Thumbnail → Title → Teacher → Description → Features →
 * Price + Buy → Chapters → Related Courses
 * Share lives on the hero overlay.
 *
 * Navigation
 * ----------
 * App stack (above tabs):
 *   MainTabs → CourseDetail → ChapterList → ChapterContent
 *
 * Entry points:
 *   Home / Courses / My Learning → CourseDetail
 *   CourseDetail chapters        → ChapterContent (unlocked) or ChapterList (See all)
 *   Deep links:
 *     sharanam://course/:courseId
 *     sharanam://course/:courseId/chapters
 *     sharanam://course/:courseId/chapters/:chapterId
 */
import { Alert, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ChapterList } from '@/modules/courses/components/ChapterList';
import { CourseDetailHero } from '@/modules/courses/components/CourseDetailHero';
import { CourseDetailSkeleton } from '@/modules/courses/components/CourseDetailSkeleton';
import { CourseFeatures } from '@/modules/courses/components/CourseFeatures';
import { RelatedCourses } from '@/modules/courses/components/RelatedCourses';
import { StarRating } from '@/modules/courses/components/StarRating';
import { useCourseDetailQuery } from '@/modules/courses/hooks/useCourseDetailQuery';
import { useEnrollCourseMutation } from '@/modules/courses/hooks/useEnrollCourseMutation';
import { formatCoursePrice } from '@/modules/courses/utils/formatCoursePrice';
import { AppButton } from '@/components/ui/AppButton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import type { AppStackParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { colors, spacing, typography } from '@/theme';
import type { Chapter, CourseSummary } from '@sharanam/shared';

type Props = NativeStackScreenProps<AppStackParamList, 'CourseDetail'>;

export function CourseDetailScreen({ navigation, route }: Props) {
  const { courseId } = route.params;
  const detailQuery = useCourseDetailQuery(courseId);
  const enrollMutation = useEnrollCourseMutation(courseId);

  async function onShare(course: {
    title: string;
    teacher_name: string | null;
  }) {
    const url = Linking.createURL(`course/${courseId}`);
    try {
      await Share.share({
        title: course.title,
        message: `${course.title} by ${course.teacher_name?.trim() || 'SHARANAM Faculty'}\n${url}`,
        url,
      });
    } catch {
      // User dismissed share sheet — ignore
    }
  }

  function onBuy() {
    enrollMutation.mutate(undefined, {
      onSuccess: () => {
        Alert.alert('Enrolled', 'This course is now in My Learning.');
      },
      onError: (error) => {
        Alert.alert('Could not enroll', getApiErrorMessage(error));
      },
    });
  }

  function openRelated(course: CourseSummary) {
    navigation.push('CourseDetail', { courseId: course.id });
  }

  function openChapterList() {
    const course = detailQuery.data;
    navigation.navigate('ChapterList', {
      courseId,
      courseTitle: course?.title,
    });
  }

  function openChapter(chapter: Chapter) {
    if (chapter.is_locked) {
      Alert.alert(
        'Chapter locked',
        'Enroll in this course to unlock all chapters. Free preview chapters stay open.',
      );
      return;
    }
    navigation.navigate('ChapterContent', {
      courseId,
      chapterId: chapter.id,
    });
  }

  if (detailQuery.isLoading && !detailQuery.data) {
    return (
      <Screen style={styles.screen}>
        <CourseDetailSkeleton />
      </Screen>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <Screen>
        <ErrorState
          message={getApiErrorMessage(detailQuery.error, 'Course not found.')}
          onRetry={() => {
            void detailQuery.refetch();
          }}
        />
        <AppButton label="Go back" variant="ghost" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  const course = detailQuery.data;
  const priceLabel = course.is_free ? 'Free' : formatCoursePrice(course.price);
  const buyLabel = course.is_purchased
    ? 'Purchased'
    : course.is_free
      ? 'Enroll Free'
      : `Buy · ${priceLabel}`;

  return (
    <Screen style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <CourseDetailHero
          thumbnailUrl={course.thumbnail_url}
          title={course.title}
          onBack={() => navigation.goBack()}
          onShare={() => {
            void onShare(course);
          }}
        />

        <View style={styles.body}>
          <Text style={styles.title}>{course.title}</Text>
          <Text style={styles.teacher}>
            {course.teacher_name?.trim() || 'SHARANAM Faculty'}
          </Text>
          <StarRating rating={course.rating ?? 0} size={16} />

          <Text style={styles.description}>
            {course.description?.trim() || 'No description yet.'}
          </Text>

          <CourseFeatures features={course.features ?? []} />

          <View style={styles.priceBlock}>
            <Text style={styles.priceLabel}>Price</Text>
            <Text style={[styles.price, course.is_free && styles.priceFree]}>{priceLabel}</Text>
          </View>

          <AppButton
            label={buyLabel}
            onPress={onBuy}
            loading={enrollMutation.isPending}
            disabled={course.is_purchased || enrollMutation.isPending}
          />

          <ChapterList
            chapters={course.chapters}
            onOpenChapter={openChapter}
            onSeeAll={openChapterList}
          />
        </View>

        <RelatedCourses courses={course.related_courses ?? []} onSelect={openRelated} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  scroll: {
    paddingBottom: spacing.xl * 2,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  title: {
    color: colors.surface,
    fontSize: typography.fontSize.xxl,
    fontWeight: '800',
  },
  teacher: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    marginTop: -spacing.sm,
  },
  description: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
    lineHeight: 22,
  },
  priceBlock: {
    gap: spacing.xs,
  },
  priceLabel: {
    color: '#7A8799',
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  price: {
    color: colors.accent,
    fontSize: typography.fontSize.xxl,
    fontWeight: '800',
  },
  priceFree: {
    color: '#81C784',
  },
});
