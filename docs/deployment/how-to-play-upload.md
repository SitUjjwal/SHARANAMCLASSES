# Google Play pe app dalna — step by step

Privacy URL (already live):  
**https://sharanam-legal.vercel.app/privacy/**

Support URL:  
**https://sharanam-legal.vercel.app/support/**

Package: `com.sharanamclasses.app` · Version `1.0.0` · versionCode `1`

---

## Step 0 — AAB ready ho (wait)

Expo pe production builds **queue** me hain. Jab status **finished** ho:

1. Open https://expo.dev/accounts/ujjwalsharan/projects/sharanam-classes/builds  
2. Latest **production** build → **Download** → `.aab` save karo  

Check command:

```powershell
cd "C:\SHARANAM CLASSES\apps\mobile"
npx eas-cli build:list -p android --limit 3
```

Status `finished` + Download link mile tab Step 2.

---

## Step 1 — Play Console app create (pehli baar)

1. https://play.google.com/console  
2. **Create app**  
   - App name: `SHARANAM CLASSES`  
   - Default language: English (India) or Hindi  
   - App / Game: **App**  
   - Free / Paid: **Free** (in-app course fees alag)  
3. Declarations accept → Create  

Developer account one-time fee pehle paid hona chahiye.

---

## Step 2 — Store listing bharo

**Grow users → Store presence → Main store listing**

| Field | Value |
|-------|--------|
| App name | SHARANAM CLASSES |
| Short description | Copy from `apps/mobile/store-assets/listing-en.txt` |
| Full description | Same file |
| App icon | 512×512 (Expo icon / Play asset) |
| Feature graphic | `apps/mobile/store-assets/feature-graphic.png` (1024×500) |
| Phone screenshots | Kam se kam **2** (phone se capture) |
| Privacy Policy | `https://sharanam-legal.vercel.app/privacy/` |
| Support email | `sharanam.sp@gmail.com` |
| Support URL | `https://sharanam-legal.vercel.app/support/` |

Save.

---

## Step 3 — App content forms

**Policy → App content** (sab complete karo):

1. **Privacy policy** — URL already set  
2. **Data safety** — fill from `apps/mobile/store-assets/legal/data-safety.md`  
3. **Target audience** — e.g. 13+ or as appropriate for students  
4. **News app / COVID / Data protection** — answer honestly (usually No)  
5. **Ads** — No (unless you show ads)  
6. **Content ratings** — start questionnaire (Education)  

---

## Step 4 — AAB upload (Internal testing pehle)

1. **Test and release → Testing → Internal testing**  
2. **Create new release**  
3. Upload the `.aab` from Expo  
4. Release name: `1.0.0 (1)`  
5. Release notes: e.g. `First release — Bihar Board live classes, notes, tests.`  
6. **Next → Save → Review release → Start rollout to Internal testing**  
7. **Testers** tab → apna Gmail add karo  
8. Phone pe Play Store → Internal app link se install → test karo  

---

## Step 5 — Production

Jab Internal OK ho:

1. **Production → Create release**  
2. Same AAB promote / reuse from Internal  
3. Countries: India (ya jahan chahiye)  
4. **Send for review**  

Google review: usually **few days** (sometimes 1–7).

---

## Important warnings

| Issue | Fix |
|-------|-----|
| App LAN IP pe API call kare | Production EAS env me HTTPS API set karke **naya** AAB banao + versionCode `2` |
| Privacy URL 404 | Use Vercel link above (already 200) |
| Duplicate versionCode | Har nayi upload pe `ANDROID_VERSION_CODE` badhao in `app.config.js` |
| 3 production builds queue | Ek finish hone do; baaki cancel kar sakte ho (Expo dashboard) |

---

## Tumhara abhi ka order

1. Expo build **finished** wait / download AAB  
2. Play listing + Privacy URL paste  
3. Data safety form  
4. Internal testing upload  
5. Phone pe test  
6. Production → Send for review  
