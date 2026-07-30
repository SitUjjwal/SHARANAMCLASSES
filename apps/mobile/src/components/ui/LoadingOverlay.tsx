/**
 * Full-screen loading overlay for long auth operations.
 */
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';

type LoadingOverlayProps = {
  visible: boolean;
  message?: string;
};

export function LoadingOverlay({ visible, message = 'Please wait…' }: LoadingOverlayProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    minWidth: 180,
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: 14,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  message: {
    color: colors.surface,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
});
