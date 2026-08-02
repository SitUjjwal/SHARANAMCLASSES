/**
 * openExternal — open http(s) / tel / mailto / maps / app deep links safely.
 *
 * Rules:
 * 1. Only allowlisted schemes (blocks javascript:, file:, etc.)
 * 2. Try Linking.canOpenURL when available
 * 3. Prefer native app candidates, then https / mailto / tel fallbacks
 * 4. Alert on total failure — never throw to the UI thread
 */
import { Alert, Linking, Platform } from 'react-native';

const ALLOWED_SCHEMES = new Set([
  'https',
  'http',
  'mailto',
  'tel',
  'sms',
  'whatsapp',
  'fb',
  'instagram',
  'youtube',
  'vnd.youtube',
  'comgooglemaps',
  'maps',
  'geo',
]);

function schemeOf(url: string): string {
  const match = /^([a-z][a-z0-9+.-]*):/i.exec(url.trim());
  return (match?.[1] ?? '').toLowerCase();
}

export function isAllowedExternalUrl(url: string): boolean {
  const scheme = schemeOf(url);
  return Boolean(scheme) && ALLOWED_SCHEMES.has(scheme);
}

async function tryOpen(url: string): Promise<boolean> {
  if (!url.trim() || !isAllowedExternalUrl(url)) {
    return false;
  }
  try {
    const can = await Linking.canOpenURL(url);
    if (!can) return false;
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Attempt candidates in order; show alert if none work.
 */
export async function openExternalUrl(
  candidates: string | string[],
  options?: { failureMessage?: string },
): Promise<boolean> {
  const list = (Array.isArray(candidates) ? candidates : [candidates])
    .map((u) => u.trim())
    .filter(Boolean);

  for (const url of list) {
    if (await tryOpen(url)) return true;
  }

  // Last resort: openURL without canOpenURL (some Android builds lie)
  for (const url of list) {
    if (!isAllowedExternalUrl(url)) continue;
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      // continue
    }
  }

  Alert.alert(
    'Could not open',
    options?.failureMessage ?? 'No app is available to open this link.',
  );
  return false;
}

export async function openEmail(email: string, subject?: string): Promise<boolean> {
  const params = subject ? `?subject=${encodeURIComponent(subject)}` : '';
  return openExternalUrl(`mailto:${email}${params}`, {
    failureMessage: 'No email app is available on this device.',
  });
}

export async function openPhone(phoneE164: string): Promise<boolean> {
  const digits = phoneE164.replace(/[^\d+]/g, '');
  return openExternalUrl(`tel:${digits}`, {
    failureMessage: 'Calling is not available on this device.',
  });
}

export async function openWhatsApp(e164Digits: string): Promise<boolean> {
  const digits = e164Digits.replace(/\D/g, '');
  const native = `whatsapp://send?phone=${digits}`;
  const https = `https://wa.me/${digits}`;
  return openExternalUrl([native, https], {
    failureMessage: 'Could not open WhatsApp.',
  });
}

export async function openWebsite(url: string): Promise<boolean> {
  const https = url.startsWith('http') ? url : `https://${url}`;
  return openExternalUrl(https, {
    failureMessage: 'Could not open the website.',
  });
}

export async function openHttps(url: string, failureMessage?: string): Promise<boolean> {
  const https = url.startsWith('http') ? url : `https://${url}`;
  return openExternalUrl(https, { failureMessage });
}

export async function openGoogleMaps(input: {
  httpsUrl: string;
  queryLabel: string;
}): Promise<boolean> {
  const q = encodeURIComponent(input.queryLabel);
  const candidates =
    Platform.OS === 'ios'
      ? [
          `comgooglemaps://?q=${q}`,
          input.httpsUrl,
          `http://maps.apple.com/?q=${q}`,
        ]
      : [input.httpsUrl, `geo:0,0?q=${q}`];

  return openExternalUrl(candidates, {
    failureMessage: 'Could not open Maps.',
  });
}
