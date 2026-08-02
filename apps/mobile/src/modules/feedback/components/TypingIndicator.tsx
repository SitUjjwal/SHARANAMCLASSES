/**
 * TypingIndicator — placeholder “Support is typing…” dots.
 */
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme';

type Props = {
  visible: boolean;
};

export function TypingIndicator({ visible }: Props) {
  const theme = useAppTheme();
  const [dots, setDots] = useState('.');

  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '.' : `${d}.`));
    }, 400);
    return () => clearInterval(id);
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.bubble,
          { backgroundColor: theme.card, borderColor: theme.cardBorder },
        ]}
      >
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          Support is typing{dots}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignSelf: 'flex-start',
    marginVertical: spacing.xs,
    maxWidth: '85%',
  },
  bubble: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: {
    fontSize: typography.fontSize.sm,
    fontStyle: 'italic',
  },
});
