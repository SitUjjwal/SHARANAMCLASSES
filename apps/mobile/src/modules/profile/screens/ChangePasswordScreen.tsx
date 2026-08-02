/**
 * ChangePasswordScreen — current + new + confirm → Supabase auth.updateUser.
 */
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from '@/auth/schemas';
import { AppButton } from '@/components/ui/AppButton';
import { AppTextField } from '@/components/ui/AppTextField';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Screen } from '@/components/ui/Screen';
import { useChangePasswordMutation } from '@/hooks/useAuthMutations';
import { PasswordStrengthHints } from '@/modules/profile/components/PasswordStrengthHints';
import type { AppStackParamList } from '@/types/navigation';
import { useAppTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme';
import type { AuthAppError } from '@/utils/authErrors';

type Props = NativeStackScreenProps<AppStackParamList, 'ChangePassword'>;

export function ChangePasswordScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const mutation = useChangePasswordMutation();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  const newPassword = watch('newPassword');

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(values, {
      onSuccess: () => navigation.goBack(),
    });
  });

  const apiError = mutation.error as AuthAppError | Error | null;

  return (
    <Screen>
      <LoadingOverlay
        visible={mutation.isPending}
        message="Updating password…"
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          Change password
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Enter your current password, then choose a strong new one.
        </Text>

        <View style={styles.form}>
          <Controller
            control={control}
            name="currentPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppTextField
                label="Current password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                textContentType="password"
                autoComplete="password"
                error={errors.currentPassword?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppTextField
                label="New password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                textContentType="newPassword"
                autoComplete="password-new"
                error={errors.newPassword?.message}
              />
            )}
          />

          <PasswordStrengthHints password={newPassword} />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppTextField
                label="Confirm password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                textContentType="newPassword"
                autoComplete="password-new"
                error={errors.confirmPassword?.message}
              />
            )}
          />

          <ErrorMessage message={apiError?.message} />

          <AppButton
            label="Update password"
            onPress={() => void onSubmit()}
            loading={mutation.isPending}
          />
          <AppButton
            label="Cancel"
            variant="ghost"
            onPress={() => navigation.goBack()}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    marginBottom: spacing.lg,
  },
  form: {
    gap: spacing.md,
  },
});
