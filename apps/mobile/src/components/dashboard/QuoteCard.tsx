/**
 * QuoteCard — quote body only (section title is “Quote of the Day” above).
 */
import { StyleSheet, Text, View } from 'react-native';

import type { MotivationalQuote } from '@sharanam/shared';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, spacing, typography } from '@/theme';

type QuoteCardProps = {
  quote: MotivationalQuote | null;
};

export function QuoteCard({ quote }: QuoteCardProps) {
  if (!quote) {
    return (
      <EmptyState
        icon="chatbubble-ellipses-outline"
        title="No quote today"
        message="A new quote will appear here when published."
      />
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.quote}>“{quote.quote_text}”</Text>
      {quote.author ? <Text style={styles.author}>— {quote.author}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: 'rgba(201,162,39,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(201,162,39,0.35)',
  },
  quote: {
    color: colors.surface,
    fontSize: typography.fontSize.lg,
    lineHeight: 24,
    fontWeight: '600',
  },
  author: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
  },
});
