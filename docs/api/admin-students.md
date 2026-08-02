# Admin Students

Student directory for the admin panel (`/students`).

## API

| Method | Path | Notes |
|--------|------|-------|
| GET | `/admin/students?search=&class_level=&page=&pageSize=` | Paginated list (`role=student`) |
| GET | `/admin/students/:id` | Detail + enrollment count |
| PATCH | `/admin/students/:id` | Update name, phone, class, medium |

## Admin UI

- Search by name / email / phone
- Filter by class
- Edit profile fields
- Shows enrolled course count
