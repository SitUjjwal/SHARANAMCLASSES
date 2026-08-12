# Testing Checklist — SHARANAM CLASSES

Legend: `[x]` pass · `[ ]` not verified this pass · `[~]` code/config ready, needs live HTTPS env

**Environment:** Local / feature smoke (reported 5 Aug 2026) + code review for Security  
**Updated:** 5 Aug 2026

---

## Mobile

| Done | Check | Notes |
|------|--------|-------|
| [x] | **Login works** | Feature smoke ✅ |
| [x] | **Registration works** | Feature smoke (account create path) — re-confirm on prod build |
| [x] | **Payments work** | Verified ✅ |
| [x] | **Videos play** | Playing ✅ |
| [x] | **PDFs open** | Opening ✅ |
| [x] | **Notifications arrive** | Working ✅ (push on release build = FCM/google-services) |
| [x] | **Live classes join successfully** | Working ✅ |
| [x] | **Tests submit correctly** | Working ✅ |

---

## Backend

| Done | Check | Notes |
|------|--------|-------|
| [x] | **Health endpoint OK** | `GET /health` implemented; local/Docker smoke previously ✅ |
| [x] | **Database connected** | Connected ✅ · also `GET /ready` |
| [x] | **Logs generated** | Structured logger + request logger in API |
| [x] | **Monitoring active** | Monitoring routes + admin Monitoring page |

Also available: `GET /version`, `GET /release-notes`.

---

## Admin

| Done | Check | Notes |
|------|--------|-------|
| [x] | **Dashboard loads** | Admin working ✅ |
| [ ] | **Reports export** | Re-verify export download on your admin session |
| [x] | **User management works** | Students/admin paths in use ✅ |
| [x] | **Notifications send** | Notifications working ✅ |

---

## Security

| Done | Check | Notes |
|------|--------|-------|
| [~] | **HTTPS enabled** | Code: `enforceHttps` + Helmet. **Prod** needs TLS host (Railway/Caddy). Legal site already HTTPS (Vercel). |
| [x] | **Secrets stored securely** | Service role / JWT / Razorpay secret server-side; client uses anon + public keys only |
| [x] | **JWT validation** | `requireAuth` + prior production-testing ✅ |
| [x] | **Role checks** | `requirePermission` on admin routes; prior testing ✅ |

---

## Still before Play Store

| Item | Status |
|------|--------|
| Production API HTTPS URL in EAS AAB | Pending |
| Play developer fee / Console upload | Pending (card decline earlier) |
| Phone screenshots (min 2) | Pending |
| EAS production AAB | Last build failed (JS bundle / Expo outage) — retry |

---

## Quick re-run commands

```bash
curl -fsS http://localhost:4000/health
curl -fsS http://localhost:4000/ready
curl -fsS http://localhost:4000/version
```

**Related:** [launch-checklist.md](./launch-checklist.md) · [PLAY-ASSETS.md](../../apps/mobile/store-assets/PLAY-ASSETS.md)
