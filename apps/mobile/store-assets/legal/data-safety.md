# Data Safety Information — SHARANAM CLASSES (Google Play)

**Last reviewed:** 4 August 2026  
**Package:** `com.sharanam.classes`  
**Privacy policy URL (required):** `https://www.sharanamclasses.com/privacy`  

Use this document to fill **Play Console → App content → Data safety**. Answers below reflect the current product design (Bihar Board learning: live classes, notes, tests, smart learning). Update if you add ads, sell data, or new SDKs.

---

## 1. Overview answers

| Play question | Recommended answer |
|---------------|-------------------|
| Does your app collect or share user data? | **Yes — collects** |
| Is all user data encrypted in transit? | **Yes** (HTTPS / TLS) |
| Do you provide a way for users to request deletion? | **Yes** — email sharanam.sp@gmail.com (and improve in-app later if needed) |
| Do you sell user data? | **No** |
| Family / children | Target students including possible minors under institute/parent context — complete Play Families policies only if you declare family program |

---

## 2. Data types collected (map to Play categories)

Declare **Collected** (and **Shared** only if a third party receives it for their own purposes — payment processors typically count as “service providers”; follow Play’s latest definitions).

| Data type | Collected? | Purpose | Optional? | Ephemeral? |
|-----------|------------|---------|-----------|------------|
| Name | Yes | Account | No | No |
| Email address | Yes | Account / support | No | No |
| Phone number | Yes | Account / support | May be required by institute | No |
| User IDs | Yes | Account | No | No |
| Other user info (class, medium) | Yes | App functionality | Varies | No |
| Photos (profile) | Yes, if user picks | App functionality | Yes | No |
| App interactions / learning progress | Yes | App functionality / analytics (internal) | No | No |
| Crash logs / diagnostics | Yes (if enabled) | App functionality / stability | — | May be short-lived |
| Device or other IDs | Yes (push token / install-related) | App functionality / notifications | Notifications optional | No |
| Purchase history / payment info | Yes (order metadata; card data via Razorpay) | App functionality | Purchases optional | No |

**Approximate location / precise location:** Not collected for core features → declare **No** unless you add it.  
**Contacts / SMS / call log:** **No**.  
**Health / financial info beyond purchases:** **No** (purchases → Purchase history).  
**Web browsing history:** **No**.

---

## 3. Data sharing

| Recipient type | Shared? | Notes |
|----------------|---------|--------|
| Sold to third parties | **No** | |
| Shared for advertising | **No** (unless you later add ads SDK) | |
| Shared with payment processor | Service provider processing | Razorpay for checkout |
| Shared with cloud infra | Service providers | Supabase, R2, host |

In Play forms, mark **sharing** carefully: many apps mark payment and infrastructure as collection handled by the developer with processors as service providers. Align with [Play Data safety guidance](https://support.google.com/googleplay/android-developer/answer/10787469).

---

## 4. Security practices (declare)

- [x] Data encrypted in transit (HTTPS)  
- [ ] Users can request deletion → **Yes** (email)  
- [ ] Committed to Play Families policy → only if enrolled  

---

## 5. SDK / library checklist (review each release)

| SDK | May collect | Action |
|-----|-------------|--------|
| Supabase JS | Auth identifiers | Already declared |
| Expo Notifications | Push token | Declare device ID / notifications-related |
| Razorpay (if opened) | Payment data | Purchase / financial handling via partner |
| Expo / React Native core | Diagnostics possible | Crash logs if any |

When you add Firebase Analytics, Ads, or Facebook SDK, update this form **before** release.

---

## 6. Account deletion (Play requirement)

Play requires a deletion path for apps with account creation.

**Current production-ready path:**

1. User opens https://sharanam-legal.vercel.app/delete-account/ **or** emails **sharanam.sp@gmail.com**  
2. Subject: `Account deletion request`  
3. Staff verifies identity and deletes/anonymises account data within **≤ 30 days**  
4. Confirm by email  

**Play Console — Delete account URL:** https://sharanam-legal.vercel.app/delete-account/  

Optional later: in-app **Delete account** button calling an API.

---

## 7. Store listing URLs to publish

| Document | Suggested URL |
|----------|----------------|
| Privacy Policy | https://sharanam-legal.vercel.app/privacy/ |
| Delete account | https://sharanam-legal.vercel.app/delete-account/ |
| Terms & Conditions | https://sharanam-legal.vercel.app/terms/ |
| Refund Policy | https://sharanam-legal.vercel.app/refund/ |
| Cancellation Policy | https://sharanam-legal.vercel.app/cancellation/ |
| Cookie Policy | https://sharanam-legal.vercel.app/cookies/ |
| Support | https://sharanam-legal.vercel.app/support/ |

Source markdown: `apps/mobile/store-assets/legal/`

---

## 8. Production-ready checklist

- [ ] Host all legal pages on HTTPS (no login wall)  
- [ ] Play Console → Data safety completed using §2–§4  
- [ ] Privacy URL saved in Store listing + Data safety  
- [ ] Support email monitored: sharanam.sp@gmail.com  
- [ ] Refund/cancellation process known to admin staff  
- [ ] Re-review this file whenever adding SDKs or new data fields  

**Verdict:** Documentation is **production-ready** for Play submission once the URLs are publicly live.
