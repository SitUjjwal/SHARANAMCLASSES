/**
 * PdfLoadingOverlay — centered spinner while cache download / WebView boots.
 */
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';

type PdfLoadingOverlayProps = {
  message?: string;
};

export function PdfLoadingOverlay({
  message = 'Loading PDF…',
}: PdfLoadingOverlayProps) {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(11,31,58,0.72)',
  },
  message: {
    color: colors.surface,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
});
