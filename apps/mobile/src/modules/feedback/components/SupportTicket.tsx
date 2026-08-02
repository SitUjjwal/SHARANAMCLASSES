/**
 * SupportTicket — support ticket list row.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme';

export type SupportTicketData = {
  id: string;
  subject: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  updated_at: string;
};

type Props = {
  ticket: SupportTicketData;
  onPress?: () => void;
};

export function SupportTicket({ ticket, onPress }: Props) {
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
        <Text style={[styles.subject, { color: theme.textPrimary }]}>
          {ticket.subject}
        </Text>
        <Text style={[styles.meta, { color: theme.textSecondary }]}>
          {ticket.status} · {dateLabel}
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
  subject: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  meta: {
    fontSize: typography.fontSize.sm,
    textTransform: 'capitalize',
  },
  chevron: {
    fontSize: 22,
    fontWeight: '300',
  },
});
