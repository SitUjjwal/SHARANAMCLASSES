# Production Testing Checklist

Verified **2026-08-04** (Docker live + code review for lazy load).

**Running:** Docker — API `:4000`, Admin `:8080` (healthy).

Legend: ✅ Pass · ⚠️ Manual click needed · ❌ Fail

---

## Security — ✅ all

| Check | Status |
|--------|--------|
| JWT validation | ✅ |
| Unauthorized requests blocked | ✅ |
| Input validation works | ✅ |
| Rate limiting enforced | ✅ |
| Secure headers enabled | ✅ |

---

## Performance

| Check | Status | Evidence |
|--------|--------|----------|
| API response under target | ✅ | Docker `/health` fast |
| Image caching works | ✅ | `expo-image` + nginx `/assets/` |
| Pagination works | ✅ | API `page` / `pageSize` |
| Lazy loading works | ✅ | Infinite query + `onEndReached` on Courses, Live Classes, Purchase History, Notifications |

---

## Monitoring — ✅ all

| Check | Status |
|--------|--------|
| Metrics update | ✅ |
| Logs recorded | ✅ |
| Alerts generated | ✅ |

---

## Environments & runtime ops

| Check | Status | Notes |
|--------|--------|----------|
| Dev / Staging / Prod compose separated | ✅ | `docker-compose.yml`, `.staging.yml`, `.prod.yml` |
| `APP_ENV` + env validation | ✅ | Zod + deployed-tier secret assert |
| `GET /health` liveness | ✅ | Public |
| `GET /ready` readiness | ✅ | Public; DB + shutdown gate |
| Graceful shutdown | ✅ | SIGTERM → stop jobs → `server.close` |
| Production docs | ✅ | `docs/deployment/production.md` |

---

## Backup

| Check | Status | Evidence |
|--------|--------|----------|
| Manual backup | ✅ | Run `8c674a42-…` **succeeded**, 11170 bytes |
| Restore backup | ✅ | `settings` restore → 1 setting restored, 0 warnings |
| Scheduled backup | ✅ | Cron `0 2 * * *` in API logs |

---

## Docker — ✅ all

| Check | Status |
|--------|--------|
| Containers start | ✅ |
| Services communicate | ✅ |
| Environment variables load | ✅ |

---

## CI/CD — ✅ all

| Check | Status |
|--------|--------|
| Lint passes | ✅ |
| Tests pass | ✅ (46/46) |
| Build succeeds | ✅ |

---

## Sign-off

| | |
|--|--|
| Remaining | None for this checklist |
| Result | ✅ Ready (local Docker smoke complete) |
