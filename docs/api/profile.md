# Profile APIs

All profile routes require:

```http
Authorization: Bearer <supabase_access_token>
```

## GET /profile

Read the authenticated user's profile.

**200**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "full_name": "...",
    "email": "...",
    "phone_number": "...",
    "class_level": "10",
    "medium": "hindi",
    "created_at": "...",
    "updated_at": "..."
  }
}
```

**401** missing/invalid token  
**404** profile row missing  

## PATCH /profile

Update own profile. Send one or more fields:

```json
{
  "full_name": "Ujjwal Sharma",
  "phone_number": "9876543210",
  "class_level": "12",
  "medium": "english"
}
```

Notes:
- `email` cannot be changed here (owned by Supabase Auth)
- `class_level`: `9 | 10 | 11 | 12`
- `medium`: `hindi | english`

**200** updated profile  
**400** validation error  
**401** unauthorized  
**404** profile not found  
