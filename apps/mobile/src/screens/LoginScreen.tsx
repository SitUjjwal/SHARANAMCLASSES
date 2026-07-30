/**
 * Login Screen — email/password authentication with Supabase.
 * Brand photo shown as a circular logo above the centered welcome text
 * (not a full-screen background).
 */
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { loginSchema, type LoginFormValues } from '@/auth/schemas';
import {
  AppButton,
  AppTextField,
  ErrorMessage,
  LoadingOverlay,
  Screen,
} from '@/components/ui';
import { APP_NAME } from '@/constants';
import { useLoginMutation } from '@/hooks/useAuthMutations';
import type { AuthStackParamList } from '@/types/navigation';
import { colors, spacing, typography } from '@/theme';
import type { AuthAppError } from '@/utils/authErrors';

const brandLogo = require('../assets/splash-brand.png');

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const loginMutation = useLoginMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  function getLoginErrorMessage(): string | null {
    const error = loginMutation.error as AuthAppError | Error | null;
    if (!error) {
      return null;
    }
    return error.message;
  }

  const onSubmit = handleSubmit((values) => {
    loginMutation.mutate(values);
  });

  function goToRegister() {
    navigation.navigate('Register');
  }

  function goToForgotPassword() {
    navigation.navigate('ForgotPassword');
  }

  return (
    <Screen style={styles.screen}>
      <LoadingOverlay visible={loginMutation.isPending} message="Signing you in…" />

      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.logoRing}>
            <Image source={brandLogo} style={styles.logo} resizeMode="cover" />
          </View>
          <Text style={styles.brand}>{APP_NAME}</Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue learning</Text>
        </View>

        <View style={styles.card}>
          <ErrorMessage message={getLoginErrorMessage()} />

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
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppTextField
                label="Password"
                placeholder="Enter your password"
                secureTextEntry
                autoComplete="password"
                textContentType="password"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
              />
            )}
          />

          <AppButton
            label="Sign in"
            loading={loginMutation.isPending}
            onPress={onSubmit}
          />

          <AppButton label="Create account" variant="ghost" onPress={goToRegister} />
          <AppButton label="Forgot password?" variant="ghost" onPress={goToForgotPassword} />
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
