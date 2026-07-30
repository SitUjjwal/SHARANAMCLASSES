/**
 * Auth Zustand store — single source of truth for session UI/navigation.
 *
 * status:
 * - loading         → app launch / session restore in progress
 * - authenticated   → valid session present → show Home
 * - unauthenticated → no session → show Login stack
 */
import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

import type { AuthStatus } from '@/auth/types';

type AuthState = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  /** True after the first getSession() restore attempt finishes */
  isHydrated: boolean;
  /**
   * True while the student is completing a password-reset deep link.
   * Keeps them on ResetPassword instead of jumping to Home.
   */
  isPasswordRecovery: boolean;
  setSession: (session: Session | null) => void;
  setStatus: (status: AuthStatus) => void;
  setHydrated: (value: boolean) => void;
  setPasswordRecovery: (value: boolean) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  session: null,
  user: null,
  isHydrated: false,
  isPasswordRecovery: false,

  /**
   * setSession
   * Writes session + user into the store and derives auth status.
   * Called on app launch restore and on every Supabase auth event.
   */
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      status: session ? 'authenticated' : 'unauthenticated',
      isHydrated: true,
    }),

  /**
   * setStatus
   * Manually override status (e.g. force loading during rare edge cases).
   */
  setStatus: (status) => set({ status }),

  /**
   * setHydrated
   * Marks that the initial SecureStore session read has completed.
   */
  setHydrated: (value) => set({ isHydrated: value }),

  /**
   * setPasswordRecovery
   * Locks navigation on the new-password screen during recovery.
   */
  setPasswordRecovery: (value) => set({ isPasswordRecovery: value }),

  /**
   * reset
   * Clears session state after logout or failed restore.
   */
  reset: () =>
    set({
      status: 'unauthenticated',
      session: null,
      user: null,
      isHydrated: true,
      isPasswordRecovery: false,
    }),
}));
