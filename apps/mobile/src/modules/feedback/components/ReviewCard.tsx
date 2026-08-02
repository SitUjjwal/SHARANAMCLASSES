/**
 * ReviewCard — student review summary row.
 */
import { StyleSheet, Text, View } from 'react-native';

import { RatingStars } from '@/modules/feedback/components/RatingStars';
import { useAppTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme';

export type ReviewCardData = {
  id: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

type Props = {
  review: ReviewCardData;
};

export function ReviewCard({ review }: Props) {
  const theme = useAppTheme();
  const date = new Date(review.created_at);
  const dateLabel = Number.isNaN(date.getTime())
    ? review.created_at
    : date.toLocaleDateString('en-IN', { dateStyle: 'medium' });

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.cardBorder },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.author, { color: theme.textPrimary }]}>
          {review.author_name}
        </Text>
        <Text style={[styles.date, { color: theme.textSecondary }]}>{dateLabel}</Text>
      </View>
      <RatingStars value={review.rating} readonly size={16} />
      <Text style={[styles.comment, { color: theme.textSecondary }]}>
        {review.comment}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  author: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    flex: 1,
  },
  date: {
    fontSize: typography.fontSize.sm,
  },
  comment: {
    fontSize: typography.fontSize.md,
    lineHeight: 20,
  },
});
