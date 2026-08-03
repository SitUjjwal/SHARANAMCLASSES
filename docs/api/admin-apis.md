# Backend Admin APIs (canonical)

Flat REST surface for the admin portal. All require Bearer auth + RBAC permission.
`/admin/…` aliases remain for backward compatibility.

## Endpoints

| Method | Path | Permission | Handler |
|--------|------|------------|---------|
| **GET** | `/dashboard` | `dashboard:read` (staff) / any auth (student home) | Role-aware |
| **GET** | `/students` | `students:read` | List students |
| **GET** | `/teachers` | `teachers:read` | List teachers |
| **POST** | `/teachers` | `teachers:create` | Create teacher |
| **PUT** | `/teachers/:id` | `teachers:update` | Update teacher |
| **DELETE** | `/teachers/:id` | `teachers:delete` | Remove teacher |
| **GET** | `/analytics` | `analytics:read` | Analytics overview |
| **GET** | `/reports` | `reports:read` | Report catalog |
| **GET** | `/activity-logs` | `settings:read` | Paginated audit logs |
| **GET** | `/settings` | `settings:read` | System settings |
| **PUT** | `/settings` | `settings:update` | Update system settings |

## Notes

### `GET /dashboard`
- **Staff** with `dashboard:read` → admin KPI overview (`AdminDashboardOverview`)
- **Student** → mobile home aggregate (unchanged)

### Teachers
Nested assign APIs stay under `/admin/teachers/:id/courses` and `/live-classes`.

### Settings
Logo upload: `POST /settings/logo` (multipart field `logo`).

### Aliases still work
`/admin/dashboard/overview`, `/admin/students`, `/admin/teachers`, `/admin/analytics`, `/admin/reports`, `/admin/activity-logs`, `/admin/settings`

## Example

```http
GET /teachers
Authorization: Bearer <jwt>

PUT /teachers/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Authorization: Bearer <jwt>
Content-Type: application/json

{ "full_name": "Riya Sharma", "phone_number": "9876543210" }
```
