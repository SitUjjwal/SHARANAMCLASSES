/**
 * CourseReviewsSection — average + approved reviews + write/edit CTA.
 */
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { AppButton } from '@/components/ui/AppButton';
import { StarRating } from '@/modules/courses/components/StarRating';
import { ReviewCard } from '@/modules/feedback/components/ReviewCard';
import { fetchCourseReviews } from '@/modules/feedback/services/reviewService';
import { colors, spacing, typography } from '@/theme';
import type { CourseReview, CourseReviewPublic } from '@sharanam/shared';

type Props = {
  courseId: string;
  /** Fallback average from course payload while reviews load */
  fallbackRating?: number;
  fallbackCount?: number;
  onWriteReview: () => void;
};

export function CourseReviewsSection({
  courseId,
  fallbackRating = 0,
  fallbackCount = 0,
  onWriteReview,
}: Props) {
  const [average, setAverage] = useState(fallbackRating);
  const [count, setCount] = useState(fallbackCount);
  const [items, setItems] = useState<CourseReviewPublic[]>([]);
  const [myReview, setMyReview] = useState<CourseReview | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchCourseReviews(courseId);
      setAverage(data.average_rating);
      setCount(data.review_count);
      setItems(data.items);
      setMyReview(data.my_review);
    } catch {
      // Keep course.rating fallback if reviews endpoint unavailable
    } finally {
      setLoaded(true);
    }
  }, [courseId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const ctaLabel = myReview ? 'Edit your review' : 'Write a review';

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Ratings & reviews</Text>
      <View style={styles.summaryRow}>
        <StarRating rating={average} size={18} />
        <Text style={styles.summaryText}>
          {count > 0
            ? `${average.toFixed(1)} · ${count} review${count === 1 ? '' : 's'}`
            : 'No approved reviews yet'}
        </Text>
      </View>

      {myReview ? (
        <Text style={styles.mine}>
          Your review: {myReview.status.replace(/_/g, ' ')}
          {myReview.status === 'pending_approval'
            ? ' (not public until approved)'
            : ''}
        </Text>
      ) : null}

      <AppButton label={ctaLabel} variant="ghost" onPress={onWriteReview} />

      {loaded && items.length > 0 ? (
        <View style={styles.list}>
          {items.map((item) => (
            <ReviewCard
              key={item.id}
              review={{
                id: item.id,
                author_name: item.author_name,
                rating: item.rating,
                comment: item.comment,
                created_at: item.created_at,
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  heading: {
    color: colors.surface,
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  summaryText: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
  },
  mine: {
    color: '#C9A227',
    fontSize: typography.fontSize.sm,
  },
  list: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
