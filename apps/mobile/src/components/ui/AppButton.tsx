/**
 * Reusable primary button.
 * Why: consistent CTA styling + loading/disabled states across auth screens.
 */
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from 'react-native';

import { colors, spacing, typography } from '@/theme';

type AppButtonProps = PressableProps & {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'ghost';
};

export function AppButton({
  label,
  loading = false,
  variant = 'primary',
  disabled,
  ...props
}: AppButtonProps) {
  const isDisabled = Boolean(disabled || loading);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' ? styles.primary : styles.ghost,
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.primary : colors.surface} />
      ) : (
        <Text style={[styles.label, variant === 'ghost' ? styles.ghostLabel : null]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primary: {
    backgroundColor: colors.accent,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: colors.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
  },
  ghostLabel: {
    color: colors.surface,
  },
});
