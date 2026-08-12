# SHARANAM CLASSES — Legal website (static)

Production-ready HTML for Play Store URLs. **No build step.**

| URL path | Page |
|----------|------|
| `/` | Index of all policies |
| `/privacy/` | Privacy Policy |
| `/terms/` | Terms & Conditions |
| `/refund/` | Refund Policy |
| `/cancellation/` | Cancellation Policy |
| `/cookies/` | Cookie Policy |
| `/support/` | Support contact |

Source markdown (canonical text): `apps/mobile/store-assets/legal/`

---

## Deploy on Cloudflare Pages (recommended)

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → Connect Git (or upload).
2. Settings:
   - **Root directory:** `apps/web-legal`
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/` or `.` (same folder — static files)
3. Custom domain: `www.sharanamclasses.com` (or apex `sharanamclasses.com`).
4. After deploy, open:
   - `https://www.sharanamclasses.com/privacy/`
5. Paste that URL into **Play Console → Store listing → Privacy policy**.

### Direct Upload (no Git)

```bash
# From repo root — zip and upload folder apps/web-legal in Pages "Direct Upload"
```

Or use Wrangler:

```bash
npx wrangler pages deploy apps/web-legal --project-name=sharanam-legal
```

---

## Deploy on Vercel / Netlify

- **Root:** `apps/web-legal`
- **No build** / output = current directory
- Attach domain `www.sharanamclasses.com`

---

## Local preview

```bash
npx --yes serve apps/web-legal -p 5050
```

Open http://localhost:5050/privacy/
