# API Conventions

## Base path

All domain endpoints will live under `/api/v1`.

Health check is outside versioning: `GET /health`.

## Response envelope

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Course not found",
    "details": null
  }
}
```

Types: `ApiResponse<T>` in `@sharanam/shared`.

## Auth

- `Authorization: Bearer <supabase_access_token>`
- Middleware: `requireAuth` → optional `requireAdmin`

## Versioning

Breaking changes → new path segment (`/api/v2`) or carefully versioned DTOs in shared package.

## Webhooks

- Razorpay: dedicated route under `/api/v1/webhooks/razorpay`
- Raw body verification before JSON parse (to be implemented with feature work)
