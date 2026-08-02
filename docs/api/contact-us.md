# Contact Us (mobile)

Public contact channels on **Contact Us**. Links open native apps when installed, with safe HTTPS / tel / mailto fallbacks.

## Implementation

```
CONTACT_INFO (constants)
        │
        ▼
ContactUsScreen → ContactLinkRow
        │
        ▼
utils/openExternal.ts
  · scheme allowlist (https, mailto, tel, whatsapp, maps, …)
  · Linking.canOpenURL → Linking.openURL
  · candidate list (native app → https)
  · Alert if nothing opens
```

| Channel | Action |
|---------|--------|
| Email | `mailto:` |
| Phone | `tel:` |
| WhatsApp | `whatsapp://` → `https://wa.me/` |
| Website | `https://` |
| Facebook / Instagram / YouTube | HTTPS profile URLs |
| Google Maps | `comgooglemaps://` / Apple Maps / `geo:` → HTTPS Maps |

## Config

Edit `apps/mobile/src/constants/index.ts` → `CONTACT_INFO`.

iOS `LSApplicationQueriesSchemes` in `app.config.js` includes `whatsapp`, `tel`, `mailto`, `comgooglemaps`, etc., so `canOpenURL` works on device builds.
