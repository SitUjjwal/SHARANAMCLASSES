# API Authentication Middleware

## `requireAuth`

Protects private routes by verifying the caller's **Supabase access token**.

### Flow

```
Client
  Authorization: Bearer <supabase_access_token>
        │
        ▼
 requireAuth
  1. extract Bearer token
  2. supabase.auth.getUser(token)  ← verifies JWT with Supabase
  3. attach req.user
  4. next()  OR  401 Unauthorized
        │
        ▼
 Controller (e.g. GET /profile)
```

### Protected route

`GET /profile` — returns the signed-in student's row from `public.profiles`.

### Example request

```http
GET /profile HTTP/1.1
Host: localhost:4000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Example success

```json
{
  "success": true,
  "data": {
    "id": "...",
    "full_name": "...",
    "email": "...",
    "phone_number": "...",
    "class_level": "10",
    "medium": "hindi"
  }
}
```

### Example unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired access token"
  }
}
```

---

## Related

- [Course access middleware](./course-access-middleware.md) — purchase/enrollment → full videos vs free preview
