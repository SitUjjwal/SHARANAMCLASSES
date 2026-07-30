/**
 * Reset Password Screen.
 *
 * Expo Go often cannot open email deep links. Students can:
 * 1) Long-press the email link → Copy
 * 2) Paste it here → Continue
 * 3) Enter new password + confirm
 */
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { createSessionFromUrl } from '@/auth/createSessionFromUrl';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/auth/schemas';
import {
  AppButton,
  AppTextField,
  ErrorMessage,
  LoadingOverlay,
  Screen,
  SuccessBanner,
} from '@/components/ui';
import { APP_NAME } from '@/constants';
import { useResetPasswordMutation } from '@/hooks/useAuthMutations';
import { logout } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import type { AuthStackParamList } from '@/types/navigation';
import { colors, spacing, typography } from '@/theme';
import type { AuthAppError } from '@/utils/authErrors';

const brandLogo = require('../assets/splash-brand.png');

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ navigation }: Props) {
  const resetMutation = useResetPasswordMutation();
  const isPasswordRecovery = useAuthStore((state) => state.isPasswordRecovery);
  const setPasswordRecovery = useAuthStore((state) => state.setPasswordRecovery);

  const [pastedLink, setPastedLink] = useState('');
  const [linkPending, setLinkPending] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  function getErrorMessage(): string | null {
    const error = resetMutation.error as AuthAppError | Error | null;
    if (!error) {
      return null;
    }
    return error.message;
  }

  /**
   * onPasteLinkContinue
   * Uses the copied email / redirect URL to create a recovery session.
   */
  async function onPasteLinkContinue() {
    const url = pastedLink.trim();
    if (!url) {
      setLinkError('Paste the full link from your email first.');
      return;
    }

    setLinkPending(true);
    setLinkError(null);

    try {
      const result = await createSessionFromUrl(url);
      if (!result.created) {
        setLinkError(
          'Could not read a reset token from that link. Copy the full URL from the email and try again.',
        );
        return;
      }
      setPasswordRecovery(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'This reset link is invalid or expired. Request a new one.';
      setLinkError(message);
    } finally {
      setLinkPending(false);
    }
  }

  const onSubmit = handleSubmit((values) => {
    resetMutation.mutate(values, {
      onSuccess: async () => {
        setPasswordRecovery(false);
        try {
          await logout();
        } catch {
          // Login shows automatically after local cleanup
        }
      },
    });
  });

  function goToForgotPassword() {
    setPasswordRecovery(false);
    navigation.navigate('ForgotPassword');
  }

  const busy = resetMutation.isPending || linkPending;

  return (
    <Screen style={styles.screen}>
      <LoadingOverlay
        visible={busy}
        message={linkPending ? 'Opening reset link…' : 'Updating password…'}
      />

      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.logoRing}>
            <Image source={brandLogo} style={styles.logo} resizeMode="cover" />
          </View>
          <Text style={styles.brand}>{APP_NAME}</Text>
          <Text style={styles.title}>Set new password</Text>
          <Text style={styles.subtitle}>
            {isPasswordRecovery
              ? 'Choose a new password for your account.'
              : 'Expo Go may not open the email link automatically. Long-press the link in your email → Copy → paste below.'}
          </Text>
        </View>

        <View style={styles.card}>
          <ErrorMessage message={getErrorMessage() ?? linkError} />

          {resetMutation.isSuccess ? (
            <SuccessBanner
              title="Password updated"
              message="You can now sign in with your new password."
            />
          ) : null}

          {!isPasswordRecovery && !resetMutation.isSuccess ? (
            <>
              <AppTextField
                label="Paste reset link"
                placeholder="https://….supabase.co/auth/v1/verify?…"
                autoCapitalize="none"
                autoCorrect={false}
                multiline
                value={pastedLink}
                onChangeText={setPastedLink}
                editable={!linkPending}
              />

              <AppButton
                label="Continue with pasted link"
                loading={linkPending}
                onPress={() => {
                  void onPasteLinkContinue();
                }}
              />

              <AppButton label="Request a new link" variant="ghost" onPress={goToForgotPassword} />
              <AppButton
                label="Back to sign in"
                variant="ghost"
                onPress={() => navigation.navigate('Login')}
              />
            </>
          ) : (
            <>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AppTextField
                    label="New password"
                    placeholder="At least 8 characters"
                    autoComplete="password-new"
                    textContentType="newPassword"
                    secureTextEntry
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.password?.message}
                    editable={!resetMutation.isPending && !resetMutation.isSuccess}
                  />
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AppTextField
                    label="Confirm password"
                    placeholder="Re-enter password"
                    autoComplete="password-new"
                    textContentType="newPassword"
                    secureTextEntry
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.confirmPassword?.message}
                    editable={!resetMutation.isPending && !resetMutation.isSuccess}
                  />
                )}
              />

              <AppButton
                label="Update password"
                loading={resetMutation.isPending}
                onPress={onSubmit}
                disabled={resetMutation.isSuccess}
              />
            </>
          )}
        </View>
      </View>
    </Screen>
  );
}

const LOGO_SIZE = 96;

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoRing: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.accent,
    marginBottom: spacing.md,
    backgroundColor: '#0A3D2E',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  brand: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  title: {
    marginTop: spacing.sm,
    color: colors.surface,
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: spacing.sm,
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
    lineHeight: 20,
    textAlign: 'center',
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
