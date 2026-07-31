/**
 * StarRating — renders ★★★★☆ from a 0–5 average.
 */
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme';

type StarRatingProps = {
  rating: number;
  size?: number;
};

export function StarRating({ rating, size = 14 }: StarRatingProps) {
  const clamped = Math.min(5, Math.max(0, rating));
  const filled = Math.round(clamped);

  return (
    <View style={styles.row} accessibilityLabel={`${clamped.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Text
          key={star}
          style={[
            styles.star,
            { fontSize: size, lineHeight: size + 2 },
            star <= filled ? styles.filled : styles.empty,
          ]}
        >
          ★
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  star: {
    fontWeight: '700',
  },
  filled: {
    color: colors.accent,
  },
  empty: {
    color: 'rgba(255,255,255,0.22)',
  },
});
