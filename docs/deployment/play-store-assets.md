# Play Store assets — SHARANAM CLASSES

Copy-paste ready listing fields, legal text hosts, screenshot plan, and what each Play Console requirement means.

Package: `com.sharanamclasses.app` · App name: **SHARANAM CLASSES**

---

## Explain every requirement

| Field | What Google wants | Why it matters |
|-------|-------------------|----------------|
| **App description (full)** | Longer store page story (up to ~4000 chars) | Converts visitors; explain features clearly |
| **Short description** | Max **80 characters** under the title | First line users see in search/listing |
| **Keywords** | Not a separate Play field (unlike iOS); weave into title/description | Play search uses title + description + reviews |
| **Feature graphic** | **1024 × 500** PNG/JPEG | Top banner on store listing |
| **Screenshots** | Phone: min **2**, recommended 4–8; JPEG/PNG | Prove the product; required to publish |
| **Privacy policy** | **Public HTTPS URL** | Required; Data safety links here |
| **Terms** | Strongly recommended URL (or in-app) | Purchases, refunds, account rules |
| **Support URL** | HTTPS help / contact page | Users & reviewers need a place to get help |
| **Contact email** | Valid support inbox | Play Console + user replies |
| **Release notes** | “What’s new” per release | Testers/users see changes |

Also required separately (not generated as art here): **512×512 app icon**, content rating, Data safety form.

---

## Contact & URLs (live)

| Item | Value |
|------|--------|
| **Contact email** | `sharanam.sp@gmail.com` |
| **Support URL** | https://sharanam-legal.vercel.app/support/ |
| **Privacy Policy URL** | https://sharanam-legal.vercel.app/privacy/ |
| **Terms URL** | https://sharanam-legal.vercel.app/terms/ |
| **Website** | https://sharanam-legal.vercel.app/ |

Custom domain later: `www.sharanamclasses.com` (same paths).

### Graphic assets (in repo)

| Asset | Path |
|-------|------|
| App icon 512×512 | `apps/mobile/store-assets/play-icon-512.png` |
| Feature graphic 1024×500 | `apps/mobile/store-assets/feature-graphic.png` |
| Screenshots | `apps/mobile/store-assets/screenshots/` (capture on device) |

Quick checklist: [`apps/mobile/store-assets/PLAY-ASSETS.md`](../../apps/mobile/store-assets/PLAY-ASSETS.md)

---

## Short description (≤80 characters)

**English (80 chars):**
```text
Bihar Board learning: live classes, notes, tests & smart study — SHARANAM CLASSES
```

**Tagline (brand / marketing):**
```text
Bihar Board Learning Platform with Live Classes, Notes, Tests and Smart Learning.
```

**Hindi option:**
```text
बिहार बोर्ड: लाइव क्लास, नोट्स, टेस्ट और स्मार्ट लर्निंग — शरणम् क्लासेस
```

---

## Full description (English)

```text
SHARANAM CLASSES — Bihar Board learning platform with live classes, notes, tests, and smart learning.

Built for Bihar Board students who want organised classes, clear notes, regular tests, and progress tracking in one app — whether you study in Patna or online.

WHAT YOU CAN DO
• Follow Bihar Board–focused courses for your class
• Join live classes and never miss important sessions
• Study chapter notes and PDFs anytime
• Practice with tests, review results, and check leaderboards
• Watch video lessons with smart, structured learning paths
• Track your progress and earn certificates (as per institute rules)
• Get announcements and useful study reminders
• Learn in a clean, student-friendly app

WHO IT’S FOR
Students preparing for Bihar Board exams with SHARANAM CLASSES — school learners who want live teaching, notes, tests, and smart revision together.

ACCOUNT & PURCHASES
Create an account to access enrolled courses. Purchases and enrollments follow institute rules shown in the app. For billing help, contact support.

SUPPORT
Email: sharanam.sp@gmail.com
Web: https://www.sharanamclasses.com

Privacy: https://www.sharanamclasses.com/privacy
Terms: https://www.sharanamclasses.com/terms

Download SHARANAM CLASSES — your Bihar Board learning companion.
```

---

## Full description (Hindi — optional second language)

```text
शरणम् क्लासेस — बिहार बोर्ड लर्निंग प्लेटफ़ॉर्म: लाइव क्लास, नोट्स, टेस्ट और स्मार्ट लर्निंग।

बिहार बोर्ड के छात्रों के लिए एक ऐप में संगठित कक्षाएँ, स्पष्ट नोट्स, नियमित टेस्ट और प्रगति ट्रैकिंग।

आप क्या कर सकते हैं
• अपनी कक्षा के अनुसार बिहार बोर्ड फोकस्ड कोर्स
• लाइव क्लास में शामिल हों
• अध्याय नोट्स और PDF कभी भी पढ़ें
• टेस्ट दें, रिजल्ट और लीडरबोर्ड देखें
• स्मार्ट, संरचित वीडियो पाठ
• प्रमाणपत्र (नियमों के अनुसार) और घोषणाएँ

सहायता: sharanam.sp@gmail.com
वेबसाइट: https://www.sharanamclasses.com
```

---

## Keywords (weave into description; Play has no keyword field)

```text
SHARANAM CLASSES, Bihar Board, Bihar Board app, live classes, notes, test series,
smart learning, Patna coaching, class 9 10 11 12 Bihar, online coaching Bihar,
video lectures, certificates, शरणम् क्लासेस, बिहार बोर्ड, लाइव क्लास, नोट्स, टेस्ट
```

---

## Feature graphic

| Spec | Value |
|------|--------|
| Size | **1024 × 500** px |
| Format | PNG or JPEG |
| File in repo | `apps/mobile/store-assets/feature-graphic.png` (generate/export to this path) |

Design direction: deep green / navy (`#0A3D2E`, `#0B1F3A`) + gold accent (`#C9A227`); brand name large; no clutter.

If the generated image is 16:9, crop/resize to **exactly 1024×500** before upload.

---

## Screenshots list (capture from Expo Go / device)

Play phone screenshots: min width **320px**, max **3840px**; 16:9 or 9:16 common. Capture **at least 2**, aim for **6**.

| # | Screen | What to show | Suggested filename |
|---|--------|--------------|--------------------|
| 1 | Home / Dashboard | Courses + announcements | `01-home.png` |
| 2 | Course detail | Chapters / enroll CTA | `02-course.png` |
| 3 | Live classes | Upcoming / join | `03-live.png` |
| 4 | Test / result | Attempt or score | `04-test.png` |
| 5 | Notes or PDF | Learning content | `05-notes.png` |
| 6 | Profile / certificates | Progress or certificate | `06-profile.png` |

**How to capture (Android):** Expo Go → open each screen → device screenshot → copy to `apps/mobile/store-assets/screenshots/`.

Do **not** add device frames unless you want; Play accepts raw screenshots.

---

## Privacy Policy (host as HTTPS page)

Full text: [`apps/mobile/store-assets/legal/privacy-policy.md`](../../apps/mobile/store-assets/legal/privacy-policy.md)  
Publish at: `https://www.sharanamclasses.com/privacy`

---

## Terms & Conditions

[`legal/terms-and-conditions.md`](../../apps/mobile/store-assets/legal/terms-and-conditions.md) → `https://www.sharanamclasses.com/terms`

## Refund Policy

[`legal/refund-policy.md`](../../apps/mobile/store-assets/legal/refund-policy.md) → `https://www.sharanamclasses.com/refund`

## Cancellation Policy

[`legal/cancellation-policy.md`](../../apps/mobile/store-assets/legal/cancellation-policy.md) → `https://www.sharanamclasses.com/cancellation`

## Cookie Policy

[`legal/cookie-policy.md`](../../apps/mobile/store-assets/legal/cookie-policy.md) → `https://www.sharanamclasses.com/cookies`

## Data Safety Information (Play Console)

[`legal/data-safety.md`](../../apps/mobile/store-assets/legal/data-safety.md) — use to fill **App content → Data safety** (not a public store page).

Index: [`legal/README.md`](../../apps/mobile/store-assets/legal/README.md)

**Deploy HTML (recommended):** [`apps/web-legal/`](../../apps/web-legal/) — Cloudflare Pages root = `apps/web-legal`, no build. Then use `https://www.sharanamclasses.com/privacy/`.

---

## Release notes (v1.0.0 / versionCode 1)

**English (What’s new):**
```text
Welcome to SHARANAM CLASSES 1.0 — Bihar Board learning platform!
• Live classes
• Notes & PDFs
• Tests, results & leaderboards
• Smart course-based learning
• Certificates and announcements
Thank you for learning with us.
```

**Hindi:**
```text
शरणम् क्लासेस 1.0 — बिहार बोर्ड लर्निंग प्लेटफ़ॉर्म!
• लाइव क्लास
• नोट्स और PDF
• टेस्ट, रिजल्ट और लीडरबोर्ड
• स्मार्ट कोर्स लर्निंग
हमारे साथ सीखने के लिए धन्यवाद।
```

---

## Play Console paste checklist

1. Create app → **SHARANAM CLASSES**  
2. Short description → above  
3. Full description → above  
4. Upload **feature graphic** (1024×500)  
5. Upload **screenshots** (list above)  
6. Upload **icon** 512×512 (export from `assets/icon.png`)  
7. Privacy policy URL  
8. Support email + support URL  
9. Store listing → save  
10. Release → paste **release notes**  

---

## Folder layout

```text
apps/mobile/store-assets/
  README.md              → this file is mirrored under docs; assets live here
  listing-en.txt         → short + full + release notes
  keywords.txt
  privacy.md
  terms.md
  feature-graphic.png    → after generate / resize
  screenshots/           → your device captures
```
