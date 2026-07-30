/**
 * Professional Register Screen.
 * Collects student details, validates them, creates a Supabase Auth user,
 * and stores profile data in `public.profiles`.
 */
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { registerSchema, type RegisterFormValues } from '@/auth/schemas';
import {
  AppButton,
  AppTextField,
  ErrorMessage,
  LoadingOverlay,
  OptionGroup,
  Screen,
  SuccessBanner,
} from '@/components/ui';
import { APP_NAME } from '@/constants';
import { CLASS_OPTIONS, MEDIUM_OPTIONS } from '@/constants/studentOptions';
import { useRegisterMutation } from '@/hooks/useAuthMutations';
import type { AuthStackParamList } from '@/types/navigation';
import { colors, spacing, typography } from '@/theme';
import type { RegisterResult } from '@/services/auth.service';

const brandLogo = require('../assets/splash-brand.png');

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const registerMutation = useRegisterMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      classLevel: undefined,
      medium: undefined,
    },
  });

  /**
   * buildSuccessMessage
   * Chooses the right success copy based on email-confirm / profile-save state.
   */
  const successMessage = useMemo(() => {
    const result = registerMutation.data as RegisterResult | undefined;
    if (!result) {
      return null;
    }

    if (result.emailConfirmationRequired) {
      return 'Account created. Check your email to confirm, then sign in. Your profile was saved.';
    }

    if (result.profileSaved) {
      return 'Registration successful. Your profile has been saved. You can sign in now.';
    }

    return 'Registration successful.';
  }, [registerMutation.data]);

  /**
   * onSubmit
   * Validates the form, then calls the register mutation (Auth + profiles insert).
   */
  const onSubmit = handleSubmit((values) => {
    registerMutation.mutate(values, {
      onSuccess: () => {
        // Clear sensitive fields after success; keep email for convenience
        reset({
          fullName: '',
          email: values.email,
          password: '',
          confirmPassword: '',
          phoneNumber: '',
          classLevel: undefined,
          medium: undefined,
        });
      },
    });
  });

  /**
   * goToLogin
   * Navigates back to the Login screen.
   */
  function goToLogin() {
    navigation.navigate('Login');
  }

  return (
    <Screen style={styles.screen}>
      <LoadingOverlay visible={registerMutation.isPending} message="Creating your account…" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoRing}>
              <Image source={brandLogo} style={styles.logo} resizeMode="cover" />
            </View>
            <Text style={styles.brand}>{APP_NAME}</Text>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Register with your details to access classes and study material.
            </Text>
          </View>

          <View style={styles.card}>
            <ErrorMessage message={registerMutation.error?.message} />

            {successMessage ? (
              <SuccessBanner title="Registration successful" message={successMessage} />
            ) : null}

            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppTextField
                  label="Full Name"
                  placeholder="Enter your full name"
                  autoComplete="name"
                  textContentType="name"
                  autoCapitalize="words"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.fullName?.message}
                />
              )}
            />

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
                  placeholder="Minimum 8 characters"
                  secureTextEntry
                  autoComplete="new-password"
                  textContentType="newPassword"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.password?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppTextField
                  label="Confirm Password"
                  placeholder="Re-enter password"
                  secureTextEntry
                  autoComplete="new-password"
                  textContentType="newPassword"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="phoneNumber"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppTextField
                  label="Phone Number"
                  placeholder="10-digit mobile number"
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.phoneNumber?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="classLevel"
              render={({ field: { onChange, value } }) => (
                <OptionGroup
                  label="Class"
                  options={CLASS_OPTIONS.map((option) => ({
                    label: option.label,
                    value: option.value,
                  }))}
                  value={value}
                  onChange={onChange}
                  error={errors.classLevel?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="medium"
              render={({ field: { onChange, value } }) => (
                <OptionGroup
                  label="Medium"
                  options={MEDIUM_OPTIONS.map((option) => ({
                    label: option.label,
                    value: option.value,
                  }))}
                  value={value}
                  onChange={onChange}
                  error={errors.medium?.message}
                />
              )}
            />

            <AppButton
              label="Register"
              loading={registerMutation.isPending}
              onPress={onSubmit}
            />

            <AppButton label="Already have an account? Sign in" variant="ghost" onPress={goToLogin} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const LOGO_SIZE = 96;

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl * 2,
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
