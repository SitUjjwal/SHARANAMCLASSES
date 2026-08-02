# Module 8 — Student Profile APIs

Canonical student profile surface (aliases kept for older clients).

## Endpoints

| Method | Path | Notes |
|--------|------|-------|
| GET | `/profile` | Identity fields |
| PUT | `/profile` | Update name, phone, class, medium, avatar_* |
| GET | `/progress` | Learning progress (enrollment / chapters) |
| GET | `/certificates` | User certificates |
| GET | `/achievements` | Catalog + unlock state |
| GET | `/test-history` | Paginated scored attempts (+ rank) |
| POST | `/profile/upload-photo` | Multipart `image` → R2 → `{ avatar_url, avatar_storage_key }` |
| PUT | `/change-password` | Current + new + confirm → Supabase Auth |

### Aliases (still work)

| Alias | Canonical |
|-------|-----------|
| `PATCH /profile` | `PUT /profile` |
| `POST /profile/avatar` | `POST /profile/upload-photo` |
| `GET /learning-progress` | `GET /progress` |
| `GET /results` | `GET /test-history` |

Also: `GET /profile/overview` (hub stats), `GET /certificates/:id`, `POST /certificates/request`.

## Edit Profile flow

```
EditProfileScreen
  ├─ if new photo ──► POST /profile/upload-photo
  └─ PUT /profile ──► profiles row (+ delete old R2 key if changed)
```

## Change password

See [change-password.md](./change-password.md).

## Env (R2)

`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`
