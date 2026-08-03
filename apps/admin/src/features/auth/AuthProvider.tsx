/**
 * Auth context — Supabase session + RBAC role for admin portal.
 * Loads staff role via API so ADMIN_EMAILS bootstrap can promote → super_admin.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';

import {
  can as hasPermission,
  resolveUiRole,
  roleLabel,
} from '@/features/auth/permissions';
import { supabase } from '@/lib/supabase';
import { apiRequest } from '@/services/api';
import type { AdminPermission, RbacRole } from '@sharanam/shared';

type StaffContextResponse = {
  is_staff: boolean;
  role: RbacRole | null;
  profile_role: string | null;
  permissions: AdminPermission[];
  email: string | null;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  /** RBAC role; null if not staff */
  role: RbacRole | null;
  roleLabel: string;
  profileRole: string | null;
  isStaff: boolean;
  can: (permission: AdminPermission) => boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileRole, setProfileRole] = useState<string | null>(null);
  const [apiRole, setApiRole] = useState<RbacRole | null>(null);

  const loadStaffRole = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfileRole(null);
      setApiRole(null);
      return;
    }

    // Prefer API bootstrap (promotes ADMIN_EMAILS → super_admin)
    try {
      const data = await apiRequest<StaffContextResponse>('/auth/staff-context');
      setProfileRole(data.profile_role);
      setApiRole(data.role);
      return;
    } catch {
      // fall through to direct profile read
    }

    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    const role = (data?.role as string | undefined) ?? null;
    setProfileRole(role);
    setApiRole(resolveUiRole(role));
  }, []);

  useEffect(() => {
    let mounted = true;

    void supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      await loadStaffRole(data.session?.user?.id);
      if (mounted) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      void loadStaffRole(next?.user?.id).finally(() => {
        if (mounted) setLoading(false);
      });
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadStaffRole]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    try {
      await apiRequest('/activity/events', {
        method: 'POST',
        body: { action: 'auth.login', metadata: { client: 'admin' } },
      });
    } catch {
      // best-effort audit
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiRequest('/activity/events', {
        method: 'POST',
        body: { action: 'auth.logout', metadata: { client: 'admin' } },
      });
    } catch {
      // best-effort audit
    }
    await supabase.auth.signOut();
    setProfileRole(null);
    setApiRole(null);
  }, []);

  const role = apiRole ?? resolveUiRole(profileRole);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      role,
      roleLabel: roleLabel(role),
      profileRole,
      isStaff: role !== null,
      can: (permission: AdminPermission) => hasPermission(role, permission),
      signIn,
      signOut,
    }),
    [session, loading, role, profileRole, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
