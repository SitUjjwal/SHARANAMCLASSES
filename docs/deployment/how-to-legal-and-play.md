# How to do — Legal site + Play Store (you do these steps)

Simple click-by-click. Code is already ready in the repo.

---

## Part A — Publish Privacy Policy (required for Play)

Play needs a **public HTTPS** link. Local `localhost:5050` is only for you.

### Option 1 — Cloudflare Pages (recommended, free)

#### A1. Create Cloudflare account
1. Open https://dash.cloudflare.com and sign up / log in.
2. (Optional) Add your domain `sharanamclasses.com` later. First release can use a free `*.pages.dev` URL.

#### A2. Deploy the legal folder
**Easiest: Direct Upload (no Git needed)**

1. On your PC, open folder:  
   `C:\SHARANAM CLASSES\apps\web-legal`
2. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
3. Project name: e.g. `sharanam-legal`.
4. Drag **all files inside** `web-legal` (including `privacy`, `terms`, `styles.css`, `index.html`, etc.).
5. Click **Deploy site**.
6. Wait ~1 minute. Cloudflare shows a URL like:  
   `https://sharanam-legal.pages.dev`

#### A3. Check it works
Open in browser (must work **without login**):

| Page | URL |
|------|-----|
| Privacy | `https://YOUR-PROJECT.pages.dev/privacy/` |
| Terms | `https://YOUR-PROJECT.pages.dev/terms/` |
| Support | `https://YOUR-PROJECT.pages.dev/support/` |
| Refund | `https://YOUR-PROJECT.pages.dev/refund/` |

If Privacy opens and you can read the text → **done for Play**.

#### A4. (Optional) Custom domain
1. Pages project → **Custom domains** → Add `www.sharanamclasses.com`.
2. Follow DNS instructions Cloudflare shows.
3. Then use: `https://www.sharanamclasses.com/privacy/`

---

### Option 2 — Vercel (also free)

1. https://vercel.com → New Project.
2. Import this GitHub repo **or** use CLI.
3. Root directory: `apps/web-legal`.
4. Framework: **Other**. Build command: **empty**. Output: `.`
5. Deploy → copy the `*.vercel.app` URL + `/privacy/`.

---

### Option 3 — Wrangler from your PC (if Node installed)

```powershell
cd "C:\SHARANAM CLASSES"
npx wrangler pages deploy apps/web-legal --project-name=sharanam-legal
```

Login when asked. Then open the URL Wrangler prints + `/privacy/`.

---

## Part B — Put Privacy URL in Google Play Console

1. Open https://play.google.com/console
2. Select app **SHARANAM CLASSES** (or create app if first time).
3. Left menu → **Grow users** → **Store presence** → **Store listing**  
   (wording can be **Main store listing**).
4. Find **Privacy Policy**.
5. Paste: `https://YOUR-PROJECT.pages.dev/privacy/`  
   (or your custom domain URL).
6. Save.

Also set:
- **Email:** `sharanam.sp@gmail.com` (must be a real inbox you check)
- **Website / Support URL:** `https://YOUR-PROJECT.pages.dev/support/`

---

## Part C — Data safety form (Play)

1. Play Console → **App content** → **Data safety**.
2. Open on your PC:  
   `C:\SHARANAM CLASSES\apps\mobile\store-assets\legal\data-safety.md`
3. Answer each Play question using that file (Yes collects data, No selling, deletion via email, etc.).
4. Save / submit the form.

---

## Part D — Store images (you capture)

1. Folder: `apps/mobile/store-assets/` (listing text + feature graphic already there).
2. On a phone, take **at least 2 screenshots** of the real app (home, course, live class, test).
3. Play Console → Store listing → upload:
   - App icon 512×512 (from Expo assets if already set)
   - Feature graphic 1024×500
   - Phone screenshots

---

## Part E — Production AAB (after API is on HTTPS)

Only when your API is public, e.g. `https://api.something.com`:

1. Expo: https://expo.dev → project → **Environment variables** / EAS secrets.  
   Set for **production**:
   - `EXPO_PUBLIC_API_BASE_URL` = your HTTPS API (not `192.168…`)
   - Supabase URL + anon key
   - Razorpay key id (live when ready)
2. On PC:

```powershell
cd "C:\SHARANAM CLASSES\apps\mobile"
eas build -p android --profile production
```

3. When build finishes, download **.aab**.
4. Play Console → **Testing** → **Internal testing** → Create release → upload AAB.
5. Add yourself as tester → install from Play → verify login / PDF / live class.
6. When OK → **Production** → promote release.

---

## What you do vs what Cursor already did

| You | Already in repo |
|-----|-----------------|
| Cloudflare/Vercel deploy | `apps/web-legal/` HTML pages |
| Play Console paste URLs | Privacy/Terms/Refund markdown + HTML |
| Data safety form clicks | `data-safety.md` answers |
| Screenshots + AAB upload | Store copy, EAS config, launch checklist |
| Domain DNS | Deploy guides in `docs/deployment/` |

---

## Fastest path today (30 minutes)

1. Cloudflare → Upload `apps/web-legal` → copy `…/privacy/` link.  
2. Play → paste Privacy + Support URLs.  
3. Fill Data safety from `data-safety.md`.  
4. Message Cursor the live Privacy URL if you want a double-check.

**Local test only (already running):** http://localhost:5050/privacy/  
That does **not** count for Play — public URL does.
