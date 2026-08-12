# Google Play Store — SHARANAM CLASSES (Expo mobile)

Step-by-step guide to put the Android app on the Play Store.

App package: `com.sharanamclasses.app`  
Config: `apps/mobile/app.config.js` · Builds: `apps/mobile/eas.json`

---

## Code health (checked)

| Check | Result |
|-------|--------|
| Empty / wiped source files (`apps/admin`, `apps/mobile`) | None found |
| Android package + icons + splash | OK |
| `versionCode` | Set to `1` in `app.config.js` |
| EAS profiles | `eas.json` added (preview APK + production AAB) |
| Play Store blockers still on **you** | Privacy policy **URL**, screenshots, Play Console account, production API HTTPS, optional FCM `google-services.json` |

Local day-to-day: `npm run dev:api` + `npm run dev:mobile` — that is **not** a Play upload.

---

## Before you start (checklist)

1. **Google Play Console** account (one-time developer fee).
2. **Expo account** — [expo.dev](https://expo.dev) (free).
3. **Production API** live on HTTPS (see [backend-deploy.md](./backend-deploy.md)).
4. **Public Privacy Policy URL** (HTTPS page), e.g. `https://www.sharanamclasses.com/privacy` — Play Console requires this.
5. **Store assets** ready:
   - App icon 512×512
   - Feature graphic 1024×500
   - Phone screenshots (at least 2)
6. Production env values:
   - `EXPO_PUBLIC_API_BASE_URL=https://api.yourdomain.com`
   - `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_RAZORPAY_KEY_ID` (live key when payments go live)
   - `EXPO_PUBLIC_APP_ENV=production`

Optional but recommended for push:

- Firebase project → download `google-services.json` → place at `apps/mobile/google-services.json` (gitignored).

---

## Step 1 — Install tools

On your PC (Node already installed):

```bash
npm install -g eas-cli
eas login
```

---

## Step 2 — Link Expo project

```bash
cd apps/mobile
eas init
```

- Creates / links EAS project.
- Copy the **Project ID** into `apps/mobile/.env`:

```env
EXPO_PUBLIC_EAS_PROJECT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Also set production public env in `.env` (or EAS secrets — Step 3).

---

## Step 3 — Production environment on EAS

Either put secrets in EAS (recommended):

```bash
cd apps/mobile
eas secret:create --name EXPO_PUBLIC_API_BASE_URL --value https://api.yourdomain.com --scope project
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value https://xxxx.supabase.co --scope project
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value eyJ... --scope project
eas secret:create --name EXPO_PUBLIC_RAZORPAY_KEY_ID --value rzp_live_... --scope project
eas secret:create --name EXPO_PUBLIC_APP_ENV --value production --scope project
eas secret:create --name EXPO_PUBLIC_EAS_PROJECT_ID --value YOUR_PROJECT_ID --scope project
```

Or keep a local `.env` that EAS picks up for cloud builds when configured — secrets on EAS are safer.

---

## Step 4 — First Android production build (AAB)

Play Store needs an **Android App Bundle** (`.aab`), not a debug APK.

```bash
cd apps/mobile
npm run build:android:production
# same as: eas build --platform android --profile production
```

- First time: EAS asks to generate a **keystore** → choose **Generate new keystore** (EAS stores it; download/backup when prompted).
- Wait for the build on expo.dev → download the `.aab` when finished.

**Test APK** (friends / internal only, not for Play production):

```bash
npm run build:android:preview
```

---

## Step 5 — Create the Play Console app

1. Open [Google Play Console](https://play.google.com/console)
2. **Create app** → name `SHARANAM CLASSES`
3. Default language, app/game, free/paid
4. Accept declarations

---

## Step 6 — Store listing (Dashboard → Grow → Store presence)

Fill:

| Field | Example |
|-------|---------|
| App name | SHARANAM CLASSES |
| Short description | Online classes, tests, and learning |
| Full description | Your Hindi/English marketing copy |
| App icon | 512×512 |
| Feature graphic | 1024×500 |
| Phone screenshots | From a real device / emulator |
| Category | Education |
| Contact email | sharanam.sp@gmail.com |
| Privacy policy | **https://…/privacy** (required) |

---

## Step 7 — App content / Data safety

Complete Play questionnaires:

- Privacy policy URL  
- Data safety (account, device IDs, purchase data, etc. — match what the app really collects)  
- Ads (yes/no)  
- Target audience / content ratings  
- News / COVID / etc. as applicable  

---

## Step 8 — Upload the AAB

1. **Test and release** → **Internal testing** (recommended first)
2. Create a release → upload the `.aab` from EAS
3. Release notes (what’s new)
4. Review → start rollout to internal testers

Or from CLI (after Play API linked):

```bash
cd apps/mobile
npm run submit:android
# eas submit --platform android --profile production
```

`eas.json` submit track is set to **internal** + **draft** so nothing goes public by accident.

---

## Step 9 — Test, then production

1. Add testers (email list) on Internal testing  
2. Install from Play (testing link) — login, courses, payments (test keys if needed)  
3. When OK → promote release to **Closed** / **Open** / **Production**  
4. Production review can take hours to a few days  

---

## Step 10 — Every new update

1. Bump versions in `apps/mobile/app.config.js`:
   - `version`: `"1.0.1"` (user-visible)
   - `android.versionCode`: `2` (must be **higher** every upload)
2. Rebuild:

```bash
cd apps/mobile
npm run build:android:production
```

3. Upload new AAB to Play Console → release.

---

## Common problems

| Problem | Fix |
|---------|-----|
| White / blank admin (web) | Unrelated to Play — see admin `VITE_*` rebuild |
| Build fails missing env | Set EAS secrets / `.env` |
| Push notifications silent | Add real `google-services.json` + Firebase |
| Play rejects privacy | Host a real HTTPS privacy page |
| Wrong API in store build | Ensure production `EXPO_PUBLIC_API_BASE_URL` is HTTPS, not localhost |
| versionCode conflict | Always increase `versionCode` before each upload |

---

## Commands summary

```bash
cd apps/mobile
eas login
eas init
npm run build:android:preview      # internal APK test
npm run build:android:production   # Play Store AAB
npm run submit:android             # optional upload to Play (draft/internal)
```

Full production platform (API + Admin + mobile): also see [production.md](./production.md), [backend-deploy.md](./backend-deploy.md), [admin-deploy.md](./admin-deploy.md).
