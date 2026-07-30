/**
 * clearLocalAuthState
 * Wipes in-app auth leftovers after Supabase signOut (or if signOut fails).
 * - Zustand session/user/status
 * - Axios Authorization header
 */
import { apiClient } from '@/api/client';
import { useAuthStore } from '@/store/authStore';

export function clearLocalAuthState(): void {
  useAuthStore.getState().reset();
  delete apiClient.defaults.headers.common.Authorization;
}
