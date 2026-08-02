# Change Password

Logged-in students rotate their password via **`PUT /change-password`** → Supabase Auth.

## Endpoint

| Method | Path | Auth |
|--------|------|------|
| PUT | `/change-password` | Bearer JWT |

### Body

```json
{
  "current_password": "…",
  "new_password": "…",
  "confirm_password": "…"
}
```

| Field | Rule |
|-------|------|
| `current_password` | Required; re-verified with Supabase `signInWithPassword` |
| `new_password` | Strong (see below) |
| `confirm_password` | Must match `new_password` |

### Strong password

- ≥ 8 characters
- ≥ 1 uppercase / lowercase / number / special
- Must differ from current password

Client: Zod `changePasswordSchema` + `PasswordStrengthHints`.  
API: same rules in `changePassword.validators.ts`.

## Flow

```
ChangePasswordScreen
  → Zod validate
  → PUT /change-password (Bearer)
       1. requireAuth (JWT)
       2. signInWithPassword(email, current_password)
       3. auth.admin.updateUserById(userId, { password })
  → goBack on success
```

| Layer | Role |
|-------|------|
| Screen | RHF + Zod + strength hints |
| Express | Validate + re-auth + admin update |
| Supabase Auth | Hash + store credential |
| Postgres `profiles` | Never stores passwords |

## Security

1. **Auth required** — only the signed-in user can rotate their own password (JWT `sub`).
2. **Current-password proof** — stolen session alone is not enough; wrong current password → `401 WRONG_PASSWORD`.
3. **Hashed at rest** — Supabase Auth stores a one-way hash; never written to `profiles`.
4. **TLS in transit** — mobile → API → Supabase. Do not log request bodies.
5. **Admin update scoped to JWT user** — `updateUserById(req.user.id)` only.
6. **Client + server Zod** — weak passwords rejected before Auth; Supabase may still enforce project policy.
7. **Confirm field** — reduces lockout from typos.

Related: email recovery stays client-side (`resetPasswordForEmail` + `ResetPasswordScreen`).
