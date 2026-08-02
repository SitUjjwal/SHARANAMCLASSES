/**
 * ChatBubble — support chat message bubble.
 */
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme';

export type ChatBubbleData = {
  id: string;
  body: string;
  from_support: boolean;
  created_at: string;
};

type Props = {
  message: ChatBubbleData;
};

export function ChatBubble({ message }: Props) {
  const theme = useAppTheme();
  const mine = !message.from_support;

  return (
    <View style={[styles.row, mine ? styles.rowMine : styles.rowSupport]}>
      <View
        style={[
          styles.bubble,
          mine
            ? { backgroundColor: theme.accent }
            : { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 },
        ]}
      >
        <Text
          style={[
            styles.body,
            { color: mine ? '#0B1F3A' : theme.textPrimary },
          ]}
        >
          {message.body}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginVertical: spacing.xs,
    maxWidth: '85%',
  },
  rowMine: {
    alignSelf: 'flex-end',
  },
  rowSupport: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  body: {
    fontSize: typography.fontSize.md,
    lineHeight: 20,
  },
});
