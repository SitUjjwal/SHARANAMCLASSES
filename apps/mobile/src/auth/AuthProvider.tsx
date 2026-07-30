/**
 * AuthProvider
 *
 * Responsibilities:
 * 1) Restore session from SecureStore on app launch (`getSession`)
 * 2) Listen to Supabase `onAuthStateChange` (login / logout / token refresh / recovery)
 * 3) Handle password-reset deep links (`sharanam://reset-password`)
 * 4) Sync every change into Zustand (`useAuthStore`)
 * 5) Enable automatic redirects via RootNavigator (reads Zustand status)
 *
 * Session persistence (how it works):
 * - supabase client is created with `persistSession: true` + `secureStorageAdapter`
 * - On login, supabase-js writes the session JSON into Expo SecureStore (Keychain/Keystore)
 * - On next app launch, `getSession()` reads that SecureStore value and rebuilds the session
 * - `autoRefreshToken: true` renews access tokens in the background while the app is open
 * - On logout, supabase-js removes the SecureStore entry and fires SIGNED_OUT
 * - Password recovery: email link → deep link → session → ResetPassword screen
 */
import { useEffect, type ReactNode } from 'react';
import * as Linking from 'expo-linking';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

import { apiClient } from '@/api/client';
import {
  createSessionFromUrl,
  isResetPasswordUrl,
} from '@/auth/createSessionFromUrl';
import { supabase } from '@/auth/supabase';
import { useAuthStore } from '@/store/authStore';

type AuthProviderProps = {
  children: ReactNode;
};

/**
 * syncAxiosAuthHeader
 * Attaches / clears the Bearer token on the shared Axios client.
 */
function syncAxiosAuthHeader(session: Session | null): void {
  if (session?.access_token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${session.access_token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
}

/**
 * applySessionToStore
 * Pushes a Supabase session into Zustand and keeps Axios headers aligned.
 */
function applySessionToStore(session: Session | null): void {
  useAuthStore.getState().setSession(session);
  syncAxiosAuthHeader(session);
}

export function AuthProvider({ children }: AuthProviderProps) {
  useEffect(() => {
    let isMounted = true;

    /**
     * restoreSessionOnLaunch
     * Reads any previously saved session from SecureStore via supabase-js.
     * Until this finishes, RootNavigator keeps showing LoadingScreen.
     */
    async function restoreSessionOnLaunch(): Promise<void> {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!isMounted) {
          return;
        }

        if (error) {
          useAuthStore.getState().reset();
          syncAxiosAuthHeader(null);
          return;
        }

        applySessionToStore(data.session);
      } catch {
        if (!isMounted) {
          return;
        }
        useAuthStore.getState().reset();
        syncAxiosAuthHeader(null);
      }
    }

    /**
     * handleAuthDeepLink
     * Consumes recovery tokens/code from the email redirect URL.
     */
    async function handleAuthDeepLink(url: string): Promise<void> {
      try {
        const result = await createSessionFromUrl(url);

        if (!isMounted) {
          return;
        }

        if (result.isRecovery || isResetPasswordUrl(url)) {
          useAuthStore.getState().setPasswordRecovery(true);
        }
      } catch (error) {
        console.warn('[auth] deep link session failed', error);
      }
    }

    /**
     * handleAuthStateChange
     * Supabase fires this on:
     * - INITIAL_SESSION / SIGNED_IN  → save session → redirect Home (unless recovery)
     * - PASSWORD_RECOVERY            → show ResetPassword screen
     * - SIGNED_OUT                   → clear session → redirect Login
     * - TOKEN_REFRESHED              → update tokens in store + SecureStore
     * - USER_UPDATED                 → refresh user object
     */
    function handleAuthStateChange(event: AuthChangeEvent, session: Session | null): void {
      if (!isMounted) {
        return;
      }

      if (event === 'PASSWORD_RECOVERY') {
        useAuthStore.getState().setPasswordRecovery(true);
      }

      if (event === 'SIGNED_OUT') {
        useAuthStore.getState().setPasswordRecovery(false);
      }

      applySessionToStore(session);
    }

    void restoreSessionOnLaunch();

    const { data } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    void Linking.getInitialURL().then((url) => {
      if (url && isMounted) {
        void handleAuthDeepLink(url);
      }
    });

    const linkingSub = Linking.addEventListener('url', ({ url }) => {
      void handleAuthDeepLink(url);
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
      linkingSub.remove();
    };
  }, []);

  return children;
}
