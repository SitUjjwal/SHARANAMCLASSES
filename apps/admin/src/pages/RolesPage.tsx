/**
 * Roles & Access — permission matrix + Super Admin staff assignment.
 */
import { useCallback, useEffect, useState } from 'react';

import {
  RBAC_ACTIONS,
  RBAC_MODULE_LABELS,
  RBAC_MODULES,
  RBAC_ROLE_LABELS,
  RBAC_ROLES,
  type RbacRole,
} from '@sharanam/shared';

import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/features/auth/AuthProvider';
import { ApiClientError } from '@/services/api';
import {
  fetchRbacMatrix,
  fetchRbacStaff,
  patchStaffRole,
  type RbacCatalog,
  type RbacStaffMember,
} from '@/services/rbacService';

export function RolesPage() {
  const { can } = useAuth();
  const [catalog, setCatalog] = useState<RbacCatalog | null>(null);
  const [staff, setStaff] = useState<RbacStaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [matrix, members] = await Promise.all([
        fetchRbacMatrix(),
        fetchRbacStaff(),
      ]);
      setCatalog(matrix);
      setStaff(members);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load RBAC');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!can('roles:read')) return;
    void load();
  }, [can, load]);

  async function onChangeRole(userId: string, role: RbacRole) {
    if (!can('roles:update')) return;
    setSavingId(userId);
    setError(null);
    try {
      const updated = await patchStaffRole(userId, role);
      setStaff((prev) => prev.map((row) => (row.id === userId ? updated : row)));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to update role');
    } finally {
      setSavingId(null);
    }
  }

  if (!can('roles:read')) {
    return (
      <div className="page">
        <h1>Access denied</h1>
        <p>Only Super Admin can view Roles & Access.</p>
      </div>
    );
  }

  const granted = new Set(
    catalog?.matrix.filter((row) => Object.values(row.roles).some(Boolean)).map((r) => r.permission) ??
      [],
  );

  return (
    <div className="page">
      <PageHeader
        title="Roles & Access"
        description="Module CRUD permissions by role. Super Admin assigns staff roles."
      />

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p>Loading…</p> : null}

      {!loading && catalog ? (
        <>
          <section className="panel" style={{ marginBottom: '1.5rem', overflowX: 'auto' }}>
            <h2 style={{ marginTop: 0 }}>Permission matrix</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Module</th>
                  <th>Action</th>
                  {RBAC_ROLES.map((role) => (
                    <th key={role}>{RBAC_ROLE_LABELS[role]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RBAC_MODULES.flatMap((module) =>
                  RBAC_ACTIONS.map((action) => {
                    const permission = `${module}:${action}` as const;
                    const row = catalog.matrix.find((m) => m.permission === permission);
                    if (!row) return null;
                    // Skip empty rows where nobody has the perm except to show structure — show all
                    void granted;
                    return (
                      <tr key={permission}>
                        <td>{RBAC_MODULE_LABELS[module]}</td>
                        <td>{action}</td>
                        {RBAC_ROLES.map((role) => (
                          <td key={role}>{row.roles[role] ? '✓' : '—'}</td>
                        ))}
                      </tr>
                    );
                  }),
                )}
              </tbody>
            </table>
          </section>

          <section className="panel" style={{ overflowX: 'auto' }}>
            <h2 style={{ marginTop: 0 }}>Staff members</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Profile role</th>
                  <th>Assign</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => (
                  <tr key={member.id}>
                    <td>{member.full_name ?? '—'}</td>
                    <td>{member.email ?? '—'}</td>
                    <td>{member.role}</td>
                    <td>
                      <select
                        value={member.rbac_role ?? 'support'}
                        disabled={!can('roles:update') || savingId === member.id}
                        onChange={(e) =>
                          void onChangeRole(member.id, e.target.value as RbacRole)
                        }
                      >
                        {RBAC_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {RBAC_ROLE_LABELS[role]}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {staff.length === 0 ? (
                  <tr>
                    <td colSpan={4}>No staff profiles found.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </section>
        </>
      ) : null}
    </div>
  );
}
