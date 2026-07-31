/**
 * CourseCard layout:
 * Thumbnail → Course Name → Teacher → ₹price → ★★★★☆ → View Details
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import type { CourseSummary } from '@sharanam/shared';
import { StarRating } from '@/modules/courses/components/StarRating';
import { formatCoursePrice } from '@/modules/courses/utils/formatCoursePrice';
import { colors, spacing, typography } from '@/theme';

export type CourseCardProps = {
  course: CourseSummary;
  onPress: (course: CourseSummary) => void;
  /** Fixed width for horizontal Home lists */
  width?: number;
};

export function CourseCard({ course, onPress, width }: CourseCardProps) {
  const priceLabel = course.is_free ? 'Free' : formatCoursePrice(course.price);

  return (
    <Pressable
      style={[styles.card, width ? { width } : styles.cardFlex]}
      onPress={() => onPress(course)}
      accessibilityRole="button"
      accessibilityLabel={`${course.title}. View details`}
    >
      <View style={styles.thumbWrap}>
        {course.thumbnail_url ? (
          <Image
            source={{ uri: course.thumbnail_url }}
            style={styles.thumb}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
          />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback]}>
            <Text style={styles.thumbLetter}>{course.title.slice(0, 1).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.badgeRow}>
          {course.is_free ? (
            <View style={[styles.badge, styles.badgeFree]}>
              <Text style={styles.badgeText}>Free</Text>
            </View>
          ) : null}
          {course.is_purchased ? (
            <View style={[styles.badge, styles.badgePurchased]}>
              <Text style={styles.badgeText}>Purchased</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {course.title}
        </Text>

        <Text style={styles.teacher} numberOfLines={1}>
          {course.teacher_name?.trim() || 'SHARANAM Faculty'}
        </Text>

        <Text style={[styles.price, course.is_free && styles.priceFree]}>{priceLabel}</Text>

        <StarRating rating={course.rating ?? 0} />

        <View style={styles.cta}>
          <Text style={styles.ctaText}>View Details</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardFlex: {
    flex: 1,
  },
  thumbWrap: {
    position: 'relative',
  },
  thumb: {
    width: '100%',
    height: 120,
    backgroundColor: colors.secondary,
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbLetter: {
    color: colors.accent,
    fontSize: 28,
    fontWeight: '700',
  },
  badgeRow: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeFree: {
    backgroundColor: '#2E7D32',
  },
  badgePurchased: {
    backgroundColor: colors.accent,
  },
  badgeText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: '700',
  },
  body: {
    gap: spacing.xs,
    padding: spacing.md,
  },
  title: {
    color: colors.surface,
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    lineHeight: 20,
  },
  teacher: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
  },
  price: {
    marginTop: 2,
    color: colors.accent,
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
  },
  priceFree: {
    color: '#81C784',
  },
  cta: {
    marginTop: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 10,
    backgroundColor: colors.accent,
  },
  ctaText: {
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: '800',
  },
});
