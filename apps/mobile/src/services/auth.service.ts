/**
 * Auth service — Supabase Auth API wrappers.
 * Why: screens/hooks never call supabase.auth directly; easier to mock/test.
 */
import { supabase } from '@/auth/supabase';
import { clearLocalAuthState } from '@/auth/clearLocalAuthState';
import { getPasswordResetRedirectUrl } from '@/auth/redirectUrls';
import type {
  ChangePasswordFormValues,
  ForgotPasswordFormValues,
  LoginFormValues,
  RegisterFormValues,
  ResetPasswordFormValues,
} from '@/auth/schemas';
import { apiClient } from '@/api/client';
import { insertStudentProfile } from '@/services/profile.service';
import {
  mapChangePasswordError,
  mapForgotPasswordError,
  mapLoginError,
  mapResetPasswordError,
} from '@/utils/authErrors';

export type RegisterResult = {
  userId: string;
  emailConfirmationRequired: boolean;
  profileSaved: boolean;
};

export type LoginResult = {
  userId: string;
  email: string;
};

/**
 * registerWithEmail
 * Creates Auth user + profile (client insert when session exists).
 */
export async function registerWithEmail(values: RegisterFormValues): Promise<RegisterResult> {
  const { data, error } = await supabase.auth.signUp({
    email: values.email.trim().toLowerCase(),
    password: values.password,
    options: {
      data: {
        full_name: values.fullName.trim(),
        phone_number: values.phoneNumber.trim(),
        class_level: values.classLevel,
        medium: values.medium,
      },
    },
  });

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error('Registration failed. Please try again.');
  }

  let profileSaved = false;

  if (data.session) {
    await insertStudentProfile(data.user.id, values);
    profileSaved = true;
  }

  return {
    userId: data.user.id,
    emailConfirmationRequired: !data.session,
    profileSaved,
  };
}

/**
 * loginWithEmail
 * Authenticates with Supabase. On success, session is persisted via SecureStore
 * (configured on the Supabase client). AuthProvider then routes to Home.
 */
export async function loginWithEmail(values: LoginFormValues): Promise<LoginResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email.trim().toLowerCase(),
      password: values.password,
    });

    if (error) {
      throw error;
    }

    if (!data.session || !data.user) {
      throw new Error('Login failed. No session returned.');
    }

    // Attach token so activity log can be posted immediately
    apiClient.defaults.headers.common.Authorization = `Bearer ${data.session.access_token}`;
    try {
      await apiClient.post('/activity/events', {
        action: 'auth.login',
        metadata: { client: 'mobile' },
      });
    } catch {
      // best-effort audit
    }

    // Session is already saved by supabase-js → expo-secure-store adapter.
    return {
      userId: data.user.id,
      email: data.user.email ?? values.email,
    };
  } catch (error) {
    throw mapLoginError(error);
  }
}

/**
 * sendPasswordReset
 * Calls Supabase `resetPasswordForEmail` so the student receives a reset link.
 * Uses Expo Linking.createURL so Expo Go can open the app (not a blank browser).
 * Add that same URL (or exp://**) in Supabase Redirect URLs.
 */
export async function sendPasswordReset(values: ForgotPasswordFormValues) {
  try {
    const email = values.email.trim().toLowerCase();
    const redirectTo = getPasswordResetRedirectUrl();

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      throw error;
    }

    return {
      email,
      redirectTo,
      data,
    };
  } catch (error) {
    throw mapForgotPasswordError(error);
  }
}

/**
 * updatePassword
 * Sets a new password while a recovery session (from the email deep link) is active.
 */
export async function updatePassword(values: ResetPasswordFormValues): Promise<void> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    throw mapResetPasswordError(error);
  }
}

/**
 * changePassword
 * Logged-in flow: PUT /change-password → API re-verifies + Supabase Auth admin update.
 */
export async function changePassword(
  values: ChangePasswordFormValues,
): Promise<void> {
  try {
    await apiClient.put('/change-password', {
      current_password: values.currentPassword,
      new_password: values.newPassword,
      confirm_password: values.confirmPassword,
    });
  } catch (error) {
    throw mapChangePasswordError(error);
  }
}

/**
 * logout
 * Full session cleanup:
 * 1) supabase.auth.signOut() → removes SecureStore session + fires SIGNED_OUT
 * 2) clearLocalAuthState() → resets Zustand + Axios header (belt-and-suspenders)
 * RootNavigator then auto-switches to the Login stack.
 */
export async function logout(): Promise<void> {
  try {
    try {
      await apiClient.post('/activity/events', {
        action: 'auth.logout',
        metadata: { client: 'mobile' },
      });
    } catch {
      // best-effort audit
    }

    const { error } = await supabase.auth.signOut({ scope: 'local' });

    if (error) {
      // Still clear local app state so the user is not stuck authenticated
      clearLocalAuthState();
      throw error;
    }
  } finally {
    // Always clear Zustand / Axios even if AuthProvider event is delayed
    clearLocalAuthState();
  }
}

/**
 * getCurrentSession
 * Reads the current persisted session (used by AuthProvider).
 */
export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}
