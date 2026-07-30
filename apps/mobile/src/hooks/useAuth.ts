/**
 * useAuth — convenient selector over the Zustand auth store.
 * Used by RootNavigator for automatic redirects and by screens for user info.
 */
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const status = useAuthStore((state) => state.status);
  const session = useAuthStore((state) => state.session);
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isPasswordRecovery = useAuthStore((state) => state.isPasswordRecovery);

  return {
    status,
    session,
    user,
    isHydrated,
    isPasswordRecovery,
    isLoading: status === 'loading' || !isHydrated,
    isAuthenticated: status === 'authenticated',
  };
}
