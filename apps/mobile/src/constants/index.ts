/**
 * Brand + public contact channels for Contact Us / drawer.
 * Update these when real SHARANAM CLASSES links are finalized.
 */
export const APP_NAME = 'SHARANAM CLASSES';

export const CONTACT_INFO = {
  email: 'support@sharanamclasses.com',
  /** E.164 digits only (no +) for wa.me */
  whatsappE164: '919876543210',
  /** Display phone */
  phoneDisplay: '+91 98765 43210',
  /** Digits for tel: (with country code) */
  phoneE164: '+919876543210',
  website: 'https://www.sharanamclasses.com',
  facebook: 'https://www.facebook.com/sharanamclasses',
  instagram: 'https://www.instagram.com/sharanamclasses',
  youtube: 'https://www.youtube.com/@sharanamclasses',
  /** Human-readable address shown under Maps */
  mapsLabel: 'SHARANAM CLASSES — Patna, Bihar',
  /** Maps search / place URL (https always works as fallback) */
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=SHARANAM+CLASSES+Patna',
} as const;

/** Drawer “Follow us” — kept in sync with CONTACT_INFO. */
export const SOCIAL_LINKS = {
  facebook: CONTACT_INFO.facebook,
  instagram: CONTACT_INFO.instagram,
  telegram: 'https://t.me/sharanamclasses',
  youtube: CONTACT_INFO.youtube,
  whatsapp: `https://wa.me/${CONTACT_INFO.whatsappE164}`,
  phone: `tel:${CONTACT_INFO.phoneE164}`,
} as const;
