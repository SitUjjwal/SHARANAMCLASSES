# How to run / build / upload the Android APP

App code already exists in `apps/mobile`. You do not need to rewrite it.

---

## 1) Phone pe chalana (daily testing) — Expo Go

**Need:** API running on PC + phone same Wi‑Fi (or tunnel).

### PC pe
```powershell
cd "C:\SHARANAM CLASSES"
npm run dev:api
```
Dusri terminal:
```powershell
cd "C:\SHARANAM CLASSES"
npm run dev:mobile
```

### Phone pe
1. Install **Expo Go** from Play Store.
2. Terminal me QR code dikhega → Expo Go se scan.
3. App open hogi.

**Note:** Push notifications Expo Go me limited hote hain. Payments / full native = real APK/AAB better.

---

## 2) APK banana (friends / internal install)

```powershell
cd "C:\SHARANAM CLASSES\apps\mobile"
eas login
eas build -p android --profile preview
```

1. Build Expo site pe queue me jayegi.
2. Complete hone pe **Download** link milega.
3. Phone pe APK install karo (Unknown sources allow).

---

## 3) Play Store ke liye AAB (official release)

**Pehle zaroori:**
- API public **HTTPS** (LAN IP mat)
- Privacy URL live (`…/privacy/`)
- EAS production env me sahi `EXPO_PUBLIC_API_BASE_URL`

```powershell
cd "C:\SHARANAM CLASSES\apps\mobile"
eas build -p android --profile production
```

Output = **`.aab`** file (Play upload ke liye).

---

## 4) Play Console pe upload

1. https://play.google.com/console → apna app
2. **Testing → Internal testing → Create new release**
3. `.aab` upload
4. Release notes likho → Save → Review → Start rollout
5. Testers me apna Gmail add karo → Play se install

OK lage to **Production** track pe promote.

---

## 5) Package / version (yaad rakho)

| Item | Value |
|------|--------|
| Package | `com.sharanamclasses.app` |
| Config | `apps/mobile/app.config.js` |
| Har naya store upload | `versionCode` badhao (1 → 2 → 3…) |

---

## Quick choose

| Goal | Command / action |
|------|------------------|
| Abhi test | `npm run dev:mobile` + Expo Go |
| APK share | `eas build -p android --profile preview` |
| Play Store | Privacy URL → production AAB → Internal testing |

Full Play steps: [how-to-legal-and-play.md](./how-to-legal-and-play.md) · [mobile-play-store.md](./mobile-play-store.md)
