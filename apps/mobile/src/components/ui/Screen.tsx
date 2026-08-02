/**
 * Screen shell with safe-area + theme canvas background.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme';

type ScreenProps = ViewProps & {
  children: ReactNode;
};

export function Screen({ children, style, ...props }: ScreenProps) {
  const theme = useAppTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.canvas }]}>
      <View style={[styles.content, style]} {...props}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
});
