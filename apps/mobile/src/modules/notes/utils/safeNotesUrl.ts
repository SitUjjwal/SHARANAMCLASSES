/**
 * Safe notes URL helpers (HTTPS only) — shared by open + WebView navigation gate.
 */
export function isSafeNotesUrl(input: string): boolean {
  return normalizeSafeNotesUrl(input) !== null;
}

export function normalizeSafeNotesUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 2000) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:') return null;
    if (url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    if (!host || host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
      return null;
    }
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}
