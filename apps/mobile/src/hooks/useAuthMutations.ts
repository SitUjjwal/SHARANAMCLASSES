/**
 * Auth mutations via React Query.
 * Why: loading/error/success handling for login/register/forgot/logout/reset.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  loginWithEmail,
  logout,
  registerWithEmail,
  sendPasswordReset,
  updatePassword,
} from '@/services/auth.service';

export function useLoginMutation() {
  return useMutation({
    mutationFn: loginWithEmail,
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: registerWithEmail,
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: sendPasswordReset,
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: updatePassword,
  });
}

/**
 * useLogoutMutation
 * Runs logout(), clears React Query cache, and relies on Zustand status
 * changing to `unauthenticated` so RootNavigator shows Login.
 */
export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSettled: async () => {
      await queryClient.clear();
    },
  });
}
