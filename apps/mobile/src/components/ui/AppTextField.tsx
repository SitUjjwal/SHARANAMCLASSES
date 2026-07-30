/**
 * Reusable text field for React Hook Form controllers.
 * Why: one styled input for email/password across auth screens.
 * Password fields show an eye icon to toggle visibility.
 */
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography } from '@/theme';

type AppTextFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function AppTextField({
  label,
  error,
  secureTextEntry,
  style,
  ...props
}: AppTextFieldProps) {
  const [isHidden, setIsHidden] = useState(true);
  const isPasswordField = Boolean(secureTextEntry);
  const hideValue = isPasswordField ? isHidden : false;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, error ? styles.inputError : null]}>
        <TextInput
          placeholderTextColor="#7A8799"
          autoCapitalize="none"
          secureTextEntry={hideValue}
          style={[styles.input, style]}
          {...props}
        />
        {isPasswordField ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isHidden ? 'Show password' : 'Hide password'}
            hitSlop={8}
            onPress={() => setIsHidden((prev) => !prev)}
            style={styles.eyeButton}
          >
            <Ionicons
              name={isHidden ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#A8B3C5"
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  label: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  inputWrap: {
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 48,
    color: colors.surface,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.lg,
  },
  eyeButton: {
    padding: spacing.xs,
  },
  inputError: {
    borderColor: '#FF8A80',
  },
  error: {
    color: '#FF8A80',
    fontSize: typography.fontSize.sm,
  },
});
