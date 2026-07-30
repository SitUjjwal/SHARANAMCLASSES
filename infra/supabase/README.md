# Supabase Infrastructure

SQL migrations and seed scripts for SHARANAM CLASSES PostgreSQL (hosted on Supabase).

## Conventions

- Migrations are forward-only, timestamp-prefixed SQL files
- Auth is handled by Supabase Auth; app-specific profiles/roles live in public schema tables (to be designed with features)
- Row Level Security (RLS) policies should be defined alongside tables when feature work starts

## Apply (when CLI is configured)

```bash
supabase db push
# or apply via Supabase dashboard SQL editor
```
