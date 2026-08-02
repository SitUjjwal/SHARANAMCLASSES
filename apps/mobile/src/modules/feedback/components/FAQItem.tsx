/**
 * FAQItem — expandable question / answer.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme';

export type FAQItemData = {
  id: string;
  question: string;
  answer: string;
};

type Props = {
  item: FAQItemData;
  initiallyOpen?: boolean;
};

export function FAQItem({ item, initiallyOpen = false }: Props) {
  const theme = useAppTheme();
  const [open, setOpen] = useState(initiallyOpen);

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: theme.card, borderColor: theme.cardBorder },
      ]}
    >
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={styles.header}
      >
        <Text style={[styles.question, { color: theme.textPrimary }]}>
          {item.question}
        </Text>
        <Text style={[styles.chevron, { color: theme.textSecondary }]}>
          {open ? '−' : '+'}
        </Text>
      </Pressable>
      {open ? (
        <Text style={[styles.answer, { color: theme.textSecondary }]}>
          {item.answer}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  question: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  chevron: {
    fontSize: typography.fontSize.xl,
    fontWeight: '300',
    lineHeight: 24,
  },
  answer: {
    fontSize: typography.fontSize.md,
    lineHeight: 22,
  },
});
