/**
 * Safe notes URL validation — HTTPS only; block dangerous schemes / hosts.
 */
const BLOCKED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
]);

export function isSafeNotesUrl(input: string): boolean {
  return parseSafeNotesUrl(input) !== null;
}

/**
 * Normalize + validate. Returns canonical href or null.
 * Rules: https only, no credentials, no IP-literal private hosts, max 2000 chars.
 */
export function parseSafeNotesUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 2000) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:') return null;
  if (url.username || url.password) return null;

  const host = url.hostname.toLowerCase();
  if (!host || BLOCKED_HOSTS.has(host)) return null;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    // Block obvious loopback / private IPv4
    if (
      host.startsWith('10.') ||
      host.startsWith('127.') ||
      host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    ) {
      return null;
    }
  }

  // Strip hash fragment noise; keep query (Drive/Docs often need it)
  url.hash = '';
  return url.toString();
}
