# Google Play Assets — SHARANAM CLASSES

## Required checklist

| Asset | Spec | Status | File / URL |
|-------|------|--------|------------|
| **App Icon** | 512×512 PNG | ✅ Ready | `play-icon-512.png` |
| **Feature Graphic** | 1024×500 PNG | ✅ Ready | `feature-graphic.png` |
| **Phone Screenshots** | Min 2 (aim 4–8) | ❌ You capture | `screenshots/` — see README there |
| **Tablet Screenshots** | Optional if phone-only | ⚪ Optional | Same folder; skip if not targeting tablets |
| **Privacy Policy URL** | Public HTTPS | ✅ Live | https://sharanam-legal.vercel.app/privacy/ |
| **Support URL** | Public HTTPS | ✅ Live | https://sharanam-legal.vercel.app/support/ |

Also set in Play Console: **Contact email** `sharanam.sp@gmail.com`

---

## Upload where (Play Console)

**Grow users → Store presence → Main store listing**

1. App icon → `play-icon-512.png`  
2. Feature graphic → `feature-graphic.png`  
3. Phone screenshots → your captures from `screenshots/`  
4. Tablet screenshots → only if you support tablets (optional for phone-first)  
5. Privacy policy → paste URL above  
6. Store listing contact → Support URL + email  

Listing text: `listing-en.txt`

---

## Phone screenshots (you must do)

On a real phone with Expo Go / APK:

| File | Screen |
|------|--------|
| `screenshots/01-home.png` | Home / dashboard |
| `screenshots/02-course.png` | Course |
| `screenshots/03-live.png` | Live classes |
| `screenshots/04-test.png` | Test / result |
| `screenshots/05-notes.png` | Notes / PDF |
| `screenshots/06-profile.png` | Profile |

Min **2** images required. Prefer portrait phone shots.

---

## Tablet screenshots

- Play asks only if your app is distributed for tablets.  
- Expo config has `supportsTablet: true` on iOS; Android tablets often reuse phone UI.  
- **Safe first release:** upload phone screenshots only; leave tablet empty unless Play blocks you.  
- If required: capture the same 2–4 screens on a tablet / large emulator.

---

## Notes

- Icon is for **Play listing** (512). App adaptive icon still lives under `apps/mobile/assets/` for the binary.  
- Custom domain later: replace Vercel URLs with `https://www.sharanamclasses.com/privacy/` etc.  
- Full guide: [`docs/deployment/play-store-assets.md`](../../../docs/deployment/play-store-assets.md)
