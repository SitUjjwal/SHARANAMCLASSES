/**
 * FeedbackTicketCard — row for My Feedback list.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme';
import type { FeedbackTicket } from '@sharanam/shared';
import { FEEDBACK_STATUS_LABELS, FEEDBACK_TYPE_LABELS } from '@sharanam/shared';

type Props = {
  ticket: FeedbackTicket;
  onPress?: () => void;
};

export function FeedbackTicketCard({ ticket, onPress }: Props) {
  const theme = useAppTheme();
  const date = new Date(ticket.updated_at);
  const dateLabel = Number.isNaN(date.getTime())
    ? ticket.updated_at
    : date.toLocaleDateString('en-IN', { dateStyle: 'medium' });

  return (
    <Pressable
      style={[
        styles.row,
        { backgroundColor: theme.card, borderColor: theme.cardBorder },
      ]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
    >
      <View style={styles.textCol}>
        <Text style={[styles.ticketNo, { color: theme.accent }]}>
          {ticket.ticket_number}
        </Text>
        <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={2}>
          {ticket.title}
        </Text>
        <Text style={[styles.meta, { color: theme.textSecondary }]}>
          {FEEDBACK_TYPE_LABELS[ticket.feedback_type]} ·{' '}
          {FEEDBACK_STATUS_LABELS[ticket.status]} · {dateLabel}
        </Text>
      </View>
      {onPress ? (
        <Text style={[styles.chevron, { color: theme.textSecondary }]}>›</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  textCol: { flex: 1, gap: 2 },
  ticketNo: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  meta: {
    fontSize: typography.fontSize.sm,
  },
  chevron: {
    fontSize: 22,
    fontWeight: '300',
  },
});
