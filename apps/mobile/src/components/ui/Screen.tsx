/**
 * Screen shell with safe-area + shared background.
 * Why: avoid repeating SafeAreaView/layout boilerplate on every auth screen.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

type ScreenProps = ViewProps & {
  children: ReactNode;
};

export function Screen({ children, style, ...props }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.content, style]} {...props}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
});
