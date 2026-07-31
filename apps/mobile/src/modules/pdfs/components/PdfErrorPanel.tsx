/**
 * PdfErrorPanel — load/network failure with Retry (+ optional secondary action).
 */
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { ErrorState } from '@/components/ui/ErrorState';
import { spacing } from '@/theme';

type PdfErrorPanelProps = {
  message: string;
  onRetry: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export function PdfErrorPanel({
  message,
  onRetry,
  secondaryLabel,
  onSecondary,
}: PdfErrorPanelProps) {
  return (
    <View style={styles.wrap}>
      <ErrorState message={message} onRetry={onRetry} />
      {secondaryLabel && onSecondary ? (
        <AppButton label={secondaryLabel} variant="ghost" onPress={onSecondary} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
});
