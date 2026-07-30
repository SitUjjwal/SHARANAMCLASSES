/**
 * Forgot Password Screen.
 *
 * Flow:
 * 1) User enters email
 * 2) Zod validates email
 * 3) sendPasswordReset → supabase.auth.resetPasswordForEmail
 * 4) UI shows Loading / Success / Error
 */
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/auth/schemas';
import {
  AppButton,
  AppTextField,
  ErrorMessage,
  LoadingOverlay,
  Screen,
  SuccessBanner,
} from '@/components/ui';
import { APP_NAME } from '@/constants';
import { useForgotPasswordMutation } from '@/hooks/useAuthMutations';
import type { AuthStackParamList } from '@/types/navigation';
import { colors, spacing, typography } from '@/theme';
import type { AuthAppError } from '@/utils/authErrors';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const forgotMutation = useForgotPasswordMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  /**
   * getErrorMessage
   * Reads the mapped error message for the red banner.
   */
  function getErrorMessage(): string | null {
    const error = forgotMutation.error as AuthAppError | Error | null;
    if (!error) {
      return null;
    }
    return error.message;
  }

  /**
   * onSubmit
   * Validates the email field, then requests a Supabase password-reset email.
   */
  const onSubmit = handleSubmit((values) => {
    forgotMutation.mutate(values);
  });

  /**
   * goToLogin
   * Returns the student to the Login screen.
   */
  function goToLogin() {
    navigation.navigate('Login');
  }

  const submittedEmail = forgotMutation.isSuccess
    ? (forgotMutation.data?.email ?? getValues('email'))
    : null;

  return (
    <Screen style={styles.screen}>
      <LoadingOverlay visible={forgotMutation.isPending} message="Sending reset link…" />

      <View style={styles.container}>
        <Text style={styles.brand}>{APP_NAME}</Text>
        <Text style={styles.title}>Forgot password</Text>
        <Text style={styles.subtitle}>
          Enter your registered email and we will send a reset link.
        </Text>

        <View style={styles.card}>
          <ErrorMessage message={getErrorMessage()} />

          {forgotMutation.isSuccess && submittedEmail ? (
            <SuccessBanner
              title="Reset link sent"
              message={`Email sent to ${submittedEmail}. Expo Go often cannot open the link by itself — use “Paste link & set password” below.`}
            />
          ) : null}

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppTextField
                label="Email"
                placeholder="name@example.com"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.email?.message}
                editable={!forgotMutation.isPending}
              />
            )}
          />

          <AppButton
            label="Send reset link"
            loading={forgotMutation.isPending}
            onPress={onSubmit}
          />

          <AppButton
            label="Paste link & set password"
            variant="ghost"
            onPress={() => navigation.navigate('ResetPassword')}
          />

          <AppButton label="Back to sign in" variant="ghost" onPress={goToLogin} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  brand: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: spacing.sm,
    color: colors.surface,
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
    lineHeight: 20,
  },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
});
